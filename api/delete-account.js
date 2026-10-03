// Permanently deletes the signed-in user's Dapper account and data.
//
// Required env var: FIREBASE_SERVICE_ACCOUNT (Admin SDK — the client cannot
// delete its own profile, entitlement or problem reports under
// firestore.rules). Without it the endpoint answers 503 "unavailable".
//
// Guards, in order: same-origin, rate limit, verified ID token
// (Authorization: Bearer), a sign-in within the last 5 minutes (the client
// re-authenticates first), and no active Stripe subscription (409 — the
// user must cancel first, otherwise Stripe would keep billing a deleted
// account). Only then is anything deleted.
//
// Deleted: users/{uid}/** (closet, calendar, worn log, meta),
// userProfiles/{uid}, entitlements/{uid}, the user's communityPosts and
// problemReports, then the Firebase Auth account itself. Billing records
// stay in Stripe (tax law), not here.

import { rateLimit, clientIp, originAllowed } from "./_guard.js"
import { verifiedUser, activeStripeSubscription, adminDb } from "./_firebaseAdmin.js"
import { firebaseConfig } from "../src/firebaseConfig.js"

const RECENT_LOGIN_SECONDS = 5 * 60

async function deleteWhereUid(db, collection, uid) {
  const snap = await db.collection(collection).where("uid", "==", uid).get()
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch()
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  return snap.size
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }
  const allowed = originAllowed({
    origin: req.headers.origin,
    host: req.headers.host || "",
    allowedOriginsEnv: process.env.ALLOWED_ORIGINS,
  })
  if (!allowed) return res.status(403).json({ error: "Origin not allowed." })
  if (!rateLimit(`delete-account:${clientIp(req.headers)}`, { limit: 5, windowMs: 600000 }).allowed) {
    return res.status(429).json({ error: "Too many attempts — please try again in a few minutes." })
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return res.status(503).json({ code: "unavailable", error: "Account deletion is not available yet. Email us and we will delete your account." })
  }

  try {
    const caller = await verifiedUser(req)
    if (!caller) return res.status(401).json({ error: "Sign in required." })
    if (Date.now() / 1000 - caller.authTime > RECENT_LOGIN_SECONDS) {
      return res.status(401).json({ code: "reauth_required", error: "For your security, confirm your sign-in again, then retry." })
    }
    if (await activeStripeSubscription(caller.uid)) {
      return res.status(409).json({
        code: "has_subscription",
        error: "Cancel your subscription first (Pricing → Manage or cancel subscription), then delete your account.",
      })
    }

    const db = adminDb()
    const uid = caller.uid
    await db.recursiveDelete(db.collection("users").doc(uid))
    const posts = await deleteWhereUid(db, "communityPosts", uid)
    const reports = await deleteWhereUid(db, "problemReports", uid)
    await db.collection("userProfiles").doc(uid).delete()
    await db.collection("entitlements").doc(uid).delete()

    // Last: the sign-in account. Uses the user's own fresh ID token, so no
    // firebase-admin/auth (which cannot load on Vercel — see _firebaseAdmin.js).
    const del = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: caller.idToken }) },
    )
    if (!del.ok) {
      console.error("[api/delete-account] auth delete failed", del.status, await del.text().catch(() => ""))
      return res.status(500).json({
        code: "auth_delete_failed",
        error: "Your data was deleted, but the sign-in account could not be removed. Please email us to finish.",
      })
    }

    console.info("[api/delete-account] deleted", JSON.stringify({ posts, reports }))
    return res.status(200).json({ deleted: true })
  } catch (err) {
    console.error("[api/delete-account] error", err)
    // Every step is idempotent, so a retry after a partial failure is safe.
    return res.status(500).json({ error: "Could not finish deleting your account — some data may already be removed. Please try again (it is safe to retry) or email us." })
  }
}
