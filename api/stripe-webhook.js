// Stripe webhook → writes the user's entitlement to Firestore after payment.
//
// This runs with the Firebase Admin SDK, which bypasses Firestore security
// rules (entitlements are otherwise admin-write-only), so the plan can only be
// granted by a verified Stripe event — never by the client.
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET        whsec_…  (from the Stripe webhook endpoint)
//   FIREBASE_SERVICE_ACCOUNT     the full service-account JSON, as a single-line string
//
// Stripe must send events to:  https://<your-domain>/api/stripe-webhook
// Subscribe to: checkout.session.completed, customer.subscription.updated,
//               customer.subscription.deleted
//
// IMPORTANT: the raw request body is required for signature verification.
// On plain Vercel Node functions the body helper is a LAZY getter (it only
// parses when req.body is accessed), so reading the stream below yields the
// raw bytes. The Next.js-style `config = { api: { bodyParser: false } }` is
// NOT honored outside Next.js — just never touch req.body in this handler.

import Stripe from "stripe"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"

function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT")
    const serviceAccount = JSON.parse(raw)
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getFirestore()
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

async function grantPlan(db, { uid, email, plan, status, expiresAt, source, stripeCustomerId, stripeSubscriptionId }) {
  if (!uid) {
    console.warn("[stripe-webhook] event without uid; skipping", { stripeCustomerId })
    return
  }
  await db.collection("entitlements").doc(uid).set({
    uid,
    email: email || "",
    plan,
    status,
    source: source || "stripe",
    stripeCustomerId: stripeCustomerId || "",
    stripeSubscriptionId: stripeSubscriptionId || "",
    expiresAt: expiresAt || null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    return res.status(500).json({ error: "Stripe webhook is not configured." })
  }

  const stripe = new Stripe(secretKey)
  let event
  try {
    const rawBody = await readRawBody(req)
    const signature = req.headers["stripe-signature"]
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    const db = getDb()

    if (event.type === "checkout.session.completed") {
      const s = event.data.object
      const uid = s.client_reference_id || s.metadata?.uid
      const plan = s.metadata?.plan || "pro"
      await grantPlan(db, {
        uid,
        email: s.customer_details?.email || s.customer_email || "",
        plan,
        status: "active",
        source: "stripe",
        stripeCustomerId: s.customer || "",
        stripeSubscriptionId: s.subscription || "",
      })
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object
      const uid = sub.metadata?.uid
      const plan = sub.metadata?.plan || "pro"
      const active = sub.status === "active" || sub.status === "trialing"
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null
      await grantPlan(db, {
        uid,
        plan: active ? plan : "free",
        status: active ? "active" : "inactive",
        source: "stripe",
        expiresAt: active ? periodEnd : null,
        stripeCustomerId: sub.customer || "",
        stripeSubscriptionId: sub.id || "",
      })
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object
      const uid = sub.metadata?.uid
      await grantPlan(db, {
        uid,
        plan: "free",
        status: "inactive",
        source: "stripe_cancelled",
        expiresAt: null,
        stripeCustomerId: sub.customer || "",
        stripeSubscriptionId: sub.id || "",
      })
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error("[stripe-webhook] handler error", err)
    // Return 500 so Stripe retries delivery.
    return res.status(500).json({ error: err.message || "Webhook handler failed." })
  }
}
