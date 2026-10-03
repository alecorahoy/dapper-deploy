// Shared Firebase Admin access for the /api endpoints. Underscore prefix
// keeps Vercel from deploying this file as an endpoint.
//
// Requires FIREBASE_SERVICE_ACCOUNT: the full service-account JSON as a
// single-line string (Vercel → Project → Settings → Environment Variables).

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
// NOT firebase-admin/auth: it pulls jwks-rsa → jose 6 (ESM-only), and the
// Vercel Node runtime cannot require() it — every function importing this
// file crashed with ERR_REQUIRE_ESM (2026-10-03). Tokens are verified via the
// Identity Toolkit REST API instead (Google checks signature + expiry).
import { firebaseConfig } from "../src/firebaseConfig.js"

function adminApp() {
  if (getApps().length) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT")
  return initializeApp({ credential: cert(JSON.parse(raw)) })
}

export function adminDb() {
  adminApp()
  return getFirestore()
}

// Returns the verified Firebase user ({ uid, email }) for a request that
// carries `Authorization: Bearer <Firebase ID token>`, or null when the
// header is missing or Google rejects the token (invalid/expired/revoked
// account). Never trust a uid sent in the request body — anyone can type
// someone else's.
export async function verifiedUser(req) {
  const header = typeof req.headers.get === "function"
    ? req.headers.get("authorization")
    : req.headers.authorization
  const match = /^Bearer\s+(.+)$/i.exec(String(header || ""))
  if (!match) return null
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: match[1] }) },
  )
  if (res.status === 400) return null // INVALID_ID_TOKEN / TOKEN_EXPIRED / USER_NOT_FOUND
  if (!res.ok) throw new Error(`Token lookup failed (${res.status})`) // outage/config → 500, not a fake 401
  const user = (await res.json())?.users?.[0]
  return user?.localId ? { uid: user.localId, email: user.email || "" } : null
}

// An account counts as already subscribed while its entitlement doc holds
// an active Stripe subscription. Used to stop a second checkout (which
// would create a second, parallel subscription and double-bill).
export async function activeStripeSubscription(uid) {
  const snap = await adminDb().collection("entitlements").doc(uid).get()
  const data = snap.exists ? snap.data() : null
  if (!data || data.status !== "active" || !data.stripeSubscriptionId) return null
  return { customerId: data.stripeCustomerId || "", subscriptionId: data.stripeSubscriptionId, plan: data.plan }
}

export async function stripeCustomerId(uid) {
  const snap = await adminDb().collection("entitlements").doc(uid).get()
  return (snap.exists && snap.data().stripeCustomerId) || ""
}
