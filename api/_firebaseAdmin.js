// Shared Firebase Admin access for the /api endpoints. Underscore prefix
// keeps Vercel from deploying this file as an endpoint.
//
// Requires FIREBASE_SERVICE_ACCOUNT: the full service-account JSON as a
// single-line string (Vercel → Project → Settings → Environment Variables).

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

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

// Returns the verified Firebase user ({ uid, email, … }) for a request that
// carries `Authorization: Bearer <Firebase ID token>`, or null when the
// header is missing or the token is invalid/expired. Never trust a uid sent
// in the request body — anyone can type someone else's.
export async function verifiedUser(req) {
  const header = typeof req.headers.get === "function"
    ? req.headers.get("authorization")
    : req.headers.authorization
  const match = /^Bearer\s+(.+)$/i.exec(String(header || ""))
  if (!match) return null
  const auth = getAuth(adminApp()) // config errors (missing service account) surface as 500s
  try {
    return await auth.verifyIdToken(match[1])
  } catch {
    return null
  }
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
