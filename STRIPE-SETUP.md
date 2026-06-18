# Stripe Checkout — Setup Guide

The Pricing page now starts a real Stripe Checkout. The code is in place, but it
will not take payments until you complete the steps below. Until then, clicking a
paid plan shows a friendly "Could not start checkout" error (it no longer silently
does nothing).

## What was added
- `api/create-checkout-session.js` — creates a Stripe Checkout Session and returns its URL.
- `api/stripe-webhook.js` — receives Stripe events and writes the user's plan to Firestore (`entitlements/{uid}`) using the Firebase Admin SDK.
- `src/Dapper.jsx` `PricingPage` — the CTA buttons now call checkout (and prompt sign-in first if needed).
- `package.json` — added `stripe` and `firebase-admin`.

## 1. Install dependencies
```bash
npm install
```

## 2. Create products & prices in Stripe
In the Stripe Dashboard → Products, create two products (Dapper Pro, Dapper Elite),
each with a **monthly** and an **annual** recurring price. Copy the four `price_…` IDs.

| Plan  | Billing | Suggested amount |
|-------|---------|------------------|
| Pro   | monthly | $4.99 / mo |
| Pro   | annual  | $39.99 / yr |
| Elite | monthly | $9.99 / mo |
| Elite | annual  | $79.99 / yr |

## 3. Add environment variables (Vercel → Settings → Environment Variables)
```
STRIPE_SECRET_KEY            sk_live_… (or sk_test_… while testing)
STRIPE_PRICE_PRO_MONTHLY     price_…
STRIPE_PRICE_PRO_ANNUAL      price_…
STRIPE_PRICE_ELITE_MONTHLY   price_…
STRIPE_PRICE_ELITE_ANNUAL    price_…
STRIPE_WEBHOOK_SECRET        whsec_…  (from step 4)
APP_URL                      https://your-domain.com   (no trailing slash)
FIREBASE_SERVICE_ACCOUNT     {…the full service-account JSON on one line…}
ALLOWED_ORIGINS              https://your-domain.com   (optional; comma-separated extras)
```

### Getting `FIREBASE_SERVICE_ACCOUNT`
Firebase Console → Project Settings → Service accounts → **Generate new private key**.
Paste the entire downloaded JSON as the value (a single line is fine).

## 4. Register the webhook
Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
- URL: `https://your-domain.com/api/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the endpoint's **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

## 5. Test
- Use Stripe **test mode** keys first.
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC.
- After paying, the webhook writes `entitlements/{uid}` and the app reflects the new
  plan in real time (the app already listens to that document).

## Security notes
- The client never sets its own plan — only the verified Stripe webhook can, via the
  Admin SDK (which bypasses Firestore rules). The existing rules keep `entitlements`
  admin-write-only for everyone else.
- `create-checkout-session` and the AI endpoints are origin-locked; add any extra
  allowed origins to `ALLOWED_ORIGINS`.
