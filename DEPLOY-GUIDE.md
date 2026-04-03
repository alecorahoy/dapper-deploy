# Dapper — Deploy Guide
## Landing Page + React App on Vercel

---

## File Structure (what goes in your repo root)

```
dapper/
├── index.html          ← Landing page (pure HTML, replaces old index.html)
├── app.html            ← React app shell (NEW)
├── favicon.svg         ← Your existing favicon
├── vite.config.js      ← Updated for multi-page build
├── vercel.json         ← Updated routing rules
├── package.json        ← No changes needed
├── src/
│   ├── main.jsx        ← No changes needed
│   └── Dapper.jsx      ← No changes needed
└── public/
    └── og-image.png    ← Add your chosen OG image here
```

---

## Routing Logic

| URL           | Serves        | Description                    |
|---------------|---------------|-------------------------------|
| `/`           | `index.html`  | Landing page                  |
| `/app`        | `app.html`    | React app (Dapper.jsx)        |
| `/app/*`      | `app.html`    | React app (deep links)        |
| `/*` (other)  | `index.html`  | Fallback to landing           |

---

## Step-by-Step Deploy

### 1. Replace files in your repo
Copy these files from this guide into your project root:
- `index.html`    (replaces the old one)
- `app.html`      (new file — place at root, same level as index.html)
- `vite.config.js` (replaces old one)
- `vercel.json`   (replaces old one)

### 2. Update the "Try It Free" link in Dapper.jsx (optional)
In your Dapper.jsx, find the back-button or logo and add a home link:
```jsx
// In the Sidebar or topbar component, add:
<a href="/" style={{...}}>← Back to Home</a>
```

### 3. Build locally to verify
```bash
npm install
npm run build
```
You should see in `dist/`:
- `index.html`
- `app.html`
- `assets/` folder with React chunks

### 4. Deploy to Vercel
```bash
# If you have Vercel CLI:
vercel --prod

# Or push to GitHub and Vercel auto-deploys
git add .
git commit -m "feat: add landing page, multi-page Vite build"
git push origin main
```

### 5. Set your domain
- In Vercel dashboard → your project → Settings → Domains
- Add your custom domain (e.g., `getdapper.app`, `dapper.style`, etc.)
- Update `og:url` in `index.html` to match your real domain

---

## OG Image
- Export your chosen Canva OG design as `og-image.png` (1200×630px)
- Place it in `/public/og-image.png`
- It will be served at `yourdomain.com/og-image.png`

---

## Pricing: Update Real Links
When you set up Stripe (or your payment processor), replace the
`href="/app"` on the pricing buttons with real checkout links:

```html
<!-- Free plan -->
<a href="/app" class="btn-plan outline">Start Here</a>

<!-- Pro plan — replace with Stripe checkout -->
<a href="https://buy.stripe.com/YOUR_PRO_LINK" class="btn-plan solid">Go Pro</a>

<!-- Elite plan — replace with Stripe checkout -->
<a href="https://buy.stripe.com/YOUR_ELITE_LINK" class="btn-plan outline">Apply for Elite</a>
```

---

## Annual Pricing Values (in index.html)
Current annual prices hardcoded in the billing toggle JS:
- Pro:   $3/mo display  → $39.99/yr billed
- Elite: $6/mo display  → $79.99/yr billed

Update `toggleBilling()` in `index.html` if your pricing changes.

---

## Quick Wins After Launch
1. **Google Analytics** — add GA4 tag to `<head>` of `index.html`
2. **Hotjar** — add heatmap tracking to see scroll depth on landing
3. **Email capture** — replace "Try It Free" CTA with a form if you want a waitlist first
4. **Product Hunt** — use your chosen PH thumbnail from `dapper-asset-picker.html`

---

*Built with Claude · Designed in Google Stitch · Deployed on Vercel*
