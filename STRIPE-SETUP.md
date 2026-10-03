# Stripe Checkout — Setup Guide

The Pricing page now starts a real Stripe Checkout. The code is in place, but it
will not take payments until you complete the steps below. Until then, clicking a
paid plan shows a friendly "Could not start checkout" error (it no longer silently
does nothing).

## What was added
- `api/create-checkout-session.js` — creates a Stripe Checkout Session and returns its URL.
- `api/stripe-webhook.js` — receives Stripe events and writes the user's plan to Firestore (`entitlements/{uid}`) using the Firebase Admin SDK.
- `api/create-portal-session.js` — opens the Stripe Customer Portal (cancel, change plan, card, invoices) for the signed-in subscriber.
- `api/_firebaseAdmin.js` — shared Admin SDK access: verifies the caller's Firebase ID token and reads entitlements.
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
STRIPE_SECRET_KEY            sk_live_… (or sk_test_… while testing)   ← mark every one of these "Sensitive"
STRIPE_PRICE_PRO_MONTHLY     price_…
STRIPE_PRICE_PRO_ANNUAL      price_…
STRIPE_PRICE_ELITE_MONTHLY   price_…
STRIPE_PRICE_ELITE_ANNUAL    price_…
STRIPE_WEBHOOK_SECRET        whsec_…  (from step 4)
APP_URL                      https://dapper.inoavation.com   (no trailing slash)
FIREBASE_SERVICE_ACCOUNT     {…the full service-account JSON on one line…}   (REQUIRED: checkout, portal, webhook and account deletion all use it — until it is set, "Delete account" answers "not available yet")
ALLOWED_ORIGINS              https://your-domain.com   (optional; comma-separated extras)
```

### Getting `FIREBASE_SERVICE_ACCOUNT`
Firebase Console → Project Settings → Service accounts → **Generate new private key**.
Paste the entire downloaded JSON as the value (a single line is fine).

## 4. Register the webhook
Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
- URL: `https://dapper.inoavation.com/api/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the endpoint's **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

After the first test event, open the endpoint's delivery attempts: every one must show
an HTTP status from **our** handler (200, or 400 for a bad signature). A **403 with a
"Vercel Security Checkpoint" page** means Vercel's bot protection is challenging
Stripe — add a Vercel Firewall bypass rule for the path `/api/stripe-webhook`.

## 4b. Enable the Customer Portal (required for "Manage or cancel subscription")
Stripe Dashboard → Settings → Billing → **Customer portal** → activate it (do it in
test mode AND live mode — they are configured separately):
- Allow customers to **cancel subscriptions** (choose "at end of billing period").
- Allow **switching plans**, and add both products (Pro, Elite) with their monthly and
  annual prices — subscribers change plan here; the app never opens a second checkout
  for someone who already has an active subscription (the API answers 409).
- Allow updating payment methods and viewing invoice history.
- Fill in the business name, and link the Terms / Privacy pages.

## 5. Test
- Use Stripe **test mode** keys first.
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC.
- After paying, the webhook writes `entitlements/{uid}` and the app reflects the new
  plan in real time (the app already listens to that document).
- Then: Pricing → **Manage or cancel subscription** → switch to Elite in the portal →
  confirm the app shows Elite; cancel → confirm it drops to Free at period end.

## Security notes
- The client never sets its own plan — only the verified Stripe webhook can, via the
  Admin SDK (which bypasses Firestore rules). The existing rules keep `entitlements`
  admin-write-only for everyone else.
- `create-checkout-session` and the AI endpoints are origin-locked; add any extra
  allowed origins to `ALLOWED_ORIGINS`.
- Checkout and the portal take the user's uid/email from a verified Firebase ID token
  (`Authorization: Bearer …`), never from the request body, so nobody can open someone
  else's billing portal or attach a purchase to someone else's account.
