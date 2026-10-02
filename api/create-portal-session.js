// Opens the Stripe Customer Portal for the signed-in subscriber, where they
// can cancel, change plan, update their card and download invoices.
//
// Required env vars: STRIPE_SECRET_KEY, FIREBASE_SERVICE_ACCOUNT (APP_URL optional).
// The portal itself must be enabled once in the Stripe Dashboard
// (Settings → Billing → Customer portal); see STRIPE-SETUP.md.
//
// The caller must send `Authorization: Bearer <Firebase ID token>`. The
// Stripe customer is looked up from that verified uid's entitlement doc —
// never taken from the request — so nobody can open another user's portal.

import Stripe from "stripe"
import { rateLimit, clientIp, originAllowed } from "./_guard.js"
import { verifiedUser, stripeCustomerId } from "./_firebaseAdmin.js"

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
  if (!rateLimit(`portal:${clientIp(req.headers)}`, { limit: 10, windowMs: 600000 }).allowed) {
    return res.status(429).json({ error: "Too many attempts — please try again in a few minutes." })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({ error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." })
  }

  try {
    const caller = await verifiedUser(req)
    if (!caller) return res.status(401).json({ error: "Sign in required." })

    const customer = await stripeCustomerId(caller.uid)
    if (!customer) {
      return res.status(404).json({ error: "No Stripe subscription found on this account." })
    }

    const appUrl = (process.env.APP_URL || `https://${req.headers.host}`).replace(/\/$/, "")
    const stripe = new Stripe(secretKey)
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${appUrl}/app`,
    })
    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error("[api/create-portal-session] error", err)
    return res.status(500).json({ error: err.message || "Could not open the billing portal." })
  }
}
