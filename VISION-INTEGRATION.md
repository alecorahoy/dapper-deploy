# Dapper Vision AI — Integration Guide
## Replacing Canvas API detection with Claude claude-sonnet-4-20250514

---

## Step 1 — Add files to your project

Copy these two files into your `src/` directory:

```
src/
├── hooks/
│   └── useClaudeVision.js      ← The Claude API hook
└── components/
    └── VisionAnalyzer.jsx      ← The drop-in UI component
```

---

## Step 2 — Add Vercel environment variable

In your Vercel dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `VITE_ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your Anthropic API key)
   - **Environment:** Production + Preview + Development

Then redeploy (or run `vercel --prod`).

For local dev, add to `.env.local`:
```
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> ⚠️ **Security note:** Vite exposes `VITE_*` vars to the browser bundle.
> This is acceptable for a PWA with no backend, but be aware the key is
> visible in DevTools. Anthropic's browser-side calling requires the
> `anthropic-dangerous-direct-browser-calls: true` header, which is already
> set in the hook. For production, consider a Vercel Edge Function proxy.

---

## Step 3 — Import in Dapper.jsx

At the top of `src/Dapper.jsx`, add:

```jsx
import { VisionAnalyzer } from './components/VisionAnalyzer'
// OR if you prefer just the hook for custom UI:
import { useClaudeVision } from './hooks/useClaudeVision'
```

---

## Step 4A — Replace your Canvas analyzer (simple swap)

Find your existing outfit photo upload section and replace it with:

```jsx
<VisionAnalyzer
  mode="full"           // 'suit-only' | 'suit-shirt' | 'full'
  onAnalysisComplete={(detectedOutfit) => {
    // detectedOutfit has this shape:
    // {
    //   suit: { color, colorLabel, colorHex, pattern, patternLabel, fabric, confidence },
    //   shirt: { color, colorLabel, colorHex, pattern, patternLabel, fabric, collar, confidence },
    //   tie: { color, colorLabel, colorHex, pattern, patternLabel, material, confidence },
    //   pocketSquare: { color, colorLabel, colorHex, pattern, fold, confidence },
    //   overallConfidence: 0.91,
    //   notes: "...",
    // }
    setSuitData(detectedOutfit.suit)
    setShirtData(detectedOutfit.shirt)
    setTieData(detectedOutfit.tie)
    // ... wire to your existing Pattern Intelligence Engine
  }}
/>
```

---

## Step 4B — Wire to Pattern Intelligence Engine

The `color` and `pattern` fields in the result are already normalized to your
Pattern Matrix keys. Example mapping:

```jsx
// In your existing analyzer, you probably have something like:
const suitColor = 'navy'          // Canvas API gave you this
const suitPattern = 'chalk stripe'

// Now it comes from Claude:
const suitColor = detectedOutfit.suit.color       // → 'navy'
const suitPattern = detectedOutfit.suit.pattern   // → 'chalk stripe'

// Pass directly to your existing recommendation engine — no changes needed
const recommendations = getPatternRecommendations(suitColor, suitPattern)
```

---

## Step 4C — Mode examples for different screens

```jsx
// AI Outfit Analyzer screen (your original feature)
<VisionAnalyzer mode="full" onAnalysisComplete={handleAnalysis} />

// Outfit Validator — suit only first
<VisionAnalyzer mode="suit-only" onAnalysisComplete={handleSuitDetected} />

// Outfit Validator — suit + shirt mode B
<VisionAnalyzer mode="suit-shirt" onAnalysisComplete={handleSuitShirtDetected} />
```

---

## Step 5 — Use just the hook (advanced / custom UI)

If you want to keep your existing UI and just replace the detection logic:

```jsx
import { useClaudeVision } from './hooks/useClaudeVision'

function MyExistingAnalyzer() {
  const { analyzeOutfit, isAnalyzing, error } = useClaudeVision()

  const handlePhoto = async (file) => {
    const { success, data } = await analyzeOutfit(file)
    if (success) {
      // data.suit.color → 'navy'
      // data.suit.colorHex → '#0a0f2e'
      // data.suit.pattern → 'chalk stripe'
      // data.suit.confidence → 0.94
      setSuitColor(data.suit.color)
      setSuitPattern(data.suit.pattern)
    }
  }

  return (
    <div>
      {isAnalyzing && <p>Analyzing with AI...</p>}
      {error && <p>Error: {error}</p>}
      <input type="file" accept="image/*" onChange={e => handlePhoto(e.target.files[0])} />
    </div>
  )
}
```

---

## What Claude detects vs Canvas API

| | Canvas API (before) | Claude Vision (after) |
|---|---|---|
| **Suit color** | Raw RGB → unreliable | "midnight navy", "charcoal grey" |
| **Suit pattern** | Often wrong | chalk stripe, glen plaid, herringbone |
| **Fabric** | Not detected | worsted wool, flannel, linen |
| **Shirt color** | Often reads as grey | "white", "french blue", "pink" |
| **Shirt collar** | Not detected | spread, point, button-down, cutaway |
| **Tie pattern** | Not detected | repp stripe, foulard, polka dot |
| **Confidence** | None | Per-garment 0–100% score |
| **Correction prompt** | Manual input | Pre-filled correction modal |

---

## Cost estimate

Claude claude-sonnet-4-20250514 pricing (as of 2025):
- Input: ~$3 / 1M tokens  
- Output: ~$15 / 1M tokens
- Each outfit analysis: ~800 input tokens + ~300 output tokens
- **Cost per scan: ~$0.007 (less than 1 cent)**

At 1,000 analyses/month: ~**$7/month** total API cost.

---

## Troubleshooting

**"VITE_ANTHROPIC_API_KEY not set"**
→ Check Vercel env vars. Remember to redeploy after adding.

**"API error: 400"**
→ Image too large. The hook handles JPEG/PNG/WebP. Try a smaller file.

**"API error: 401"**  
→ Invalid API key. Check for trailing spaces or wrong key.

**Low confidence on all items**
→ Image lighting is poor. Advise users to take photos in natural light.
→ Add a "Photography tips" tooltip: natural light, hang the suit flat, avoid flash.

**Confidence < 80% triggering correction**
→ The threshold is intentional — anything below 80% shows the Correct button.
→ To change: edit `data.confidence < 0.8` in `VisionAnalyzer.jsx` line ~115.
