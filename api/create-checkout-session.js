// Creates a Stripe Checkout Session for a Dapper Pro/Elite subscription.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   STRIPE_SECRET_KEY           sk_live_… / sk_test_…
//   STRIPE_PRICE_PRO_MONTHLY    price_…  (recurring monthly)
//   STRIPE_PRICE_PRO_ANNUAL     price_…  (recurring yearly)
//   STRIPE_PRICE_ELITE_MONTHLY  price_…
//   STRIPE_PRICE_ELITE_ANNUAL   price_…
//   APP_URL                     https://your-domain.com   (no trailing slash)
//
// See STRIPE-SETUP.md for the full setup + webhook configuration.

import Stripe from "stripe"

const PRICE_ENV = {
  pro:   { monthly: "STRIPE_PRICE_PRO_MONTHLY",   annual: "STRIPE_PRICE_PRO_ANNUAL" },
  elite: { monthly: "STRIPE_PRICE_ELITE_MONTHLY", annual: "STRIPE_PRICE_ELITE_ANNUAL" },
}

function originAllowed(req) {
  const origin = req.headers.origin
  if (!origin) return true
  const host = req.headers.host || ""
  if (origin === `https://${host}` || origin === `http://${host}`) return true
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true
  const envList = String(process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim())
  return envList.includes(origin)
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }
  if (!originAllowed(req)) {
    return res.status(403).json({ error: "Origin not allowed." })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({ error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." })
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})
    const plan = String(body.plan || "").toLowerCase()
    const billing = String(body.billing || "monthly").toLowerCase()
    const uid = String(body.uid || "").trim()
    const email = String(body.email || "").trim()

    if (!uid) return res.status(401).json({ error: "Sign in required before checkout." })
    if (!PRICE_ENV[plan]) return res.status(400).json({ error: "Unknown plan." })
    if (billing !== "monthly" && billing !== "annual") {
      return res.status(400).json({ error: "Unknown billing period." })
    }

    const priceId = process.env[PRICE_ENV[plan][billing]]
    if (!priceId) {
      return res.status(500).json({ error: `Missing Stripe price for ${plan}/${billing}.` })
    }

    const appUrl = (process.env.APP_URL || `https://${req.headers.host}`).replace(/\/$/, "")
    const stripe = new Stripe(secretKey)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: uid,
      customer_email: email || undefined,
      // metadata is echoed back on the webhook event so we can grant the right plan.
      metadata: { uid, plan, billing },
      subscription_data: { metadata: { uid, plan, billing } },
      allow_promotion_codes: true,
      success_url: `${appUrl}/app?checkout=success`,
      cancel_url: `${appUrl}/app?checkout=cancelled`,
    })

    return res.status(200).json({ url: session.url, id: session.id })
  } catch (err) {
    console.error("[api/create-checkout-session] error", err)
    return res.status(500).json({ error: err.message || "Could not start checkout." })
  }
}
