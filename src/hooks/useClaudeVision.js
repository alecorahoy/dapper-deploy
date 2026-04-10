import { useState, useCallback } from 'react'

const VISION_SYSTEM_PROMPT = `You are a world-class menswear expert and fashion director with 30 years of experience at Savile Row tailors and luxury fashion houses. You have an encyclopedic knowledge of suit fabrics, patterns, and color terminology used by professional stylists.

Your task is to analyze garment photographs and return precise, professional menswear descriptions. You must be specific and confident — never vague. Use the exact vocabulary a Savile Row tailor or GQ editor would use.

CRITICAL RULES:
1. Always return ONLY valid JSON — no markdown, no preamble, no explanation
2. Use professional menswear color names (e.g. "midnight navy" not "dark blue", "oyster white" not "off-white", "charcoal" not "dark gray")
3. For patterns, use exact trade terms: solid, chalk stripe, pin stripe, glen plaid, windowpane, houndstooth, herringbone, birdseye, micro check, Prince of Wales check, tweed, linen plain, flannel, seersucker
4. For ties: repp stripe, foulard, polka dot, paisley, micro-pattern, club tie, knit, ancient madder, grenadine, solid
5. For fabrics: worsted wool, super 120s, super 150s, flannel, tweed, linen, cotton poplin, broadcloth, oxford cloth, end-on-end, chambray, silk, wool-silk blend
6. Confidence must be a decimal 0.0-1.0 based on image clarity and your certainty
7. If a garment is NOT visible in the image, set "visible": false for that item
8. colorHex must be your best estimate of the actual hex color of the garment
9. Keep color, pattern, and fabric separate. The color field must contain only the garment color, never words like herringbone, stripe, worsted wool, flannel, or tweed`

const VISION_USER_PROMPT = `Analyze this outfit photograph. Identify every visible garment and return a JSON object with this EXACT structure:

{
  "suit": { "visible": true, "color": "midnight navy", "colorHex": "#0a0f2e", "pattern": "chalk stripe", "fabric": "worsted wool", "lapel": "notch", "confidence": 0.94 },
  "shirt": { "visible": true, "color": "white", "colorHex": "#f8f6f2", "pattern": "solid", "fabric": "cotton poplin", "collar": "spread", "confidence": 0.91 },
  "tie": { "visible": true, "color": "burgundy", "colorHex": "#6d1a2a", "pattern": "repp stripe", "material": "silk", "confidence": 0.88 },
  "pocketSquare": { "visible": false, "color": null, "colorHex": null, "pattern": null, "fold": null, "confidence": 0 },
  "lighting": "natural daylight", "imageQuality": "good", "notes": "Any important observations"
}

Be precise. Use professional menswear vocabulary. Return ONLY the JSON object.`

const FULL_LOOK_USER_PROMPT = `Analyze this full menswear outfit photo. The person may be wearing a suit, shirt, tie, pocket square, shoes, and belt.

First identify what is actually visible. Then judge the combination like a strict but useful "Fashion Police" menswear expert.

Return ONLY a JSON object with this EXACT structure:

{
  "suit": { "visible": true, "color": "midnight navy", "colorHex": "#0a0f2e", "pattern": "solid", "fabric": "worsted wool", "lapel": "notch", "confidence": 0.94 },
  "shirt": { "visible": true, "color": "white", "colorHex": "#f8f6f2", "pattern": "solid", "fabric": "cotton poplin", "collar": "spread", "confidence": 0.91 },
  "tie": { "visible": true, "color": "burgundy", "colorHex": "#6d1a2a", "pattern": "grenadine", "material": "silk", "confidence": 0.88 },
  "pocketSquare": { "visible": true, "color": "white", "colorHex": "#f8f6f2", "pattern": "solid", "fold": "TV fold", "confidence": 0.82 },
  "shoes": { "visible": false, "color": null, "colorHex": null, "style": null, "confidence": 0 },
  "belt": { "visible": false, "color": null, "material": null, "confidence": 0 },
  "fashionPolice": {
    "approved": true,
    "score": 8,
    "verdict": "Fashion Police Approved",
    "assessment": "One or two direct sentences judging the exact combination.",
    "strengths": ["Specific thing that works"],
    "recommendations": ["Specific improvement if needed"],
    "priorityFix": "The single most important improvement, or null if none"
  },
  "lighting": "natural daylight",
  "imageQuality": "good",
  "notes": "Important visibility limits, if any"
}

Rules:
- Preserve exact garment relationships. Do not let a tie color become the suit color.
- Keep color, pattern, and fabric separate. For example, use color:"black", pattern:"herringbone", fabric:"worsted wool" instead of color:"black herringbone worsted wool".
- Suit color discipline: call the suit olive/green ONLY when the main suit panels clearly have a green hue. Do not label black wool as olive because of warm indoor light, shadows, camera white balance, or a yellow/green cast.
- If the suit is near-black, jet black, tuxedo black, or a very dark neutral, use "black" or "charcoal". If uncertain between black and green, choose black/charcoal and lower confidence.
- Evaluate suit/shirt/tie/pocket square harmony, pattern scale, color contrast, formality, and whether the pocket square matches too closely.
- If an item is not visible, set visible:false for that item.
- score must be 0-10.
- Keep strengths and recommendations to 1-2 short items each. Keep assessment to one short sentence.
- Be specific and practical. Return ONLY JSON.`

const SUIT_COLOR_AUDIT_SYSTEM_PROMPT = `You are a strict menswear photo color auditor. Your only job is to re-check the suit jacket/trouser color from the image, ignoring shirt, tie, pocket square, background, lighting cast, and shadows. Return ONLY valid JSON.`

const SUIT_COLOR_AUDIT_PROMPT = (firstPassColor) => `Re-check ONLY the suit color in this full outfit photo.

The first pass said the suit was "${firstPassColor || "unknown"}". Audit that result carefully.

Rules:
- Focus on the largest suit panels only: jacket body, lapels, sleeves, and trousers if visible.
- Ignore the tie, shirt, pocket square, wall, carpet, indoor light, and camera white balance.
- If the suit reads black, near-black, tuxedo black, or dark neutral under warm/greenish lighting, return "black" or "charcoal".
- Call it olive/green ONLY if the cloth itself clearly has a green hue in the main suit panels.
- If you are uncertain between olive/green and black/charcoal, choose black/charcoal and lower confidence.
- Keep color separate from pattern and fabric. Do not put "herringbone" or "worsted wool" in the color field.

Return ONLY this JSON structure:
{
  "visible": true,
  "color": "black",
  "colorHex": "#080806",
  "pattern": "herringbone",
  "fabric": "worsted wool",
  "confidence": 0.86,
  "reason": "One short reason for the color decision"
}`

const TEXT_SYSTEM_PROMPT = `You are a menswear expert. Extract garment attributes from text and evaluate combinations. Return ONLY valid JSON, no markdown, no backticks.`

const TEXT_USER_PROMPT = (userText) => [
  "Extract ALL garments mentioned from this description. Preserve exact garment relationships: suit color must come from the color attached to the suit, shirt color from the shirt, and tie color/pattern from the tie. Do not let a tie color change the suit color.",
  "",
  "Map suit color to the closest family: black, charcoal, navy, grey, blue, burgundy, brown, beige, green, white, purple, red, olive, forest green, sage, teal, rust, terracotta, tan, camel. Map suit pattern to: solid, chalk_stripe, glen_plaid, herringbone, tweed, linen, houndstooth, birdseye, seersucker, flannel.",
  "",
  "For ties, preserve multi-color descriptions such as blue and green or red and gold in the tie.color field, and preserve tie patterns such as striped, repp stripe, polka dot, paisley, knit, grenadine, foulard, plaid, solid.",
  "",
  "If a tie or shirt is mentioned, include them. If multiple items are described, provide a brief assessment evaluating the exact combination in 1-2 sentences.",
  "",
  "Return ONLY this JSON structure, with tie or shirt set to null if not mentioned:",
  "{\"suit\":{\"color\":\"green\",\"pattern\":\"solid\",\"fabric\":\"worsted wool\"},\"tie\":{\"color\":\"blue and green\",\"pattern\":\"striped\"},\"shirt\":{\"color\":\"white\",\"pattern\":\"solid\"},\"assessment\":null}",
  "",
  `Description: "${userText}"`,
].join("\n")

const normalizePattern = (claudePattern) => {
  if (!claudePattern) return 'solid'
  const p = claudePattern.toLowerCase()
  if (p.includes('chalk stripe') || p.includes('chalkstripe')) return 'chalk stripe'
  if (p.includes('glen plaid') || p.includes('glen check')) return 'glen plaid'
  if (p.includes('herringbone')) return 'herringbone'
  if (p.includes('tweed')) return 'tweed'
  if (p.includes('linen') || p.includes('plain weave')) return 'linen'
  if (p.includes('houndstooth')) return 'houndstooth'
  if (p.includes('windowpane')) return 'windowpane'
  if (p.includes('pinstripe') || p.includes('pin stripe')) return 'pin stripe'
  if (p.includes('repp') || p.includes('rep stripe')) return 'repp stripe'
  if (p.includes('polka dot') || p.includes('dot')) return 'polka dot'
  if (p.includes('paisley')) return 'paisley'
  if (p.includes('foulard')) return 'foulard'
  if (p.includes('stripe')) return 'stripe'
  if (p.includes('check') || p.includes('plaid')) return 'check'
  return 'solid'
}

const normalizeColor = (claudeColor) => {
  if (!claudeColor) return 'navy'
  const c = claudeColor.toLowerCase()
  // IMPORTANT: specific checks must come BEFORE generic ones (e.g. 'light blue' before 'blue')
  // Light blues — map to 'lightblue' to match PATTERN_MATRIX key
  if (c.includes('light blue') || c.includes('pale blue') || c.includes('powder blue') ||
      c.includes('baby blue') || c.includes('sky blue') || c.includes('ice blue') ||
      c.includes('cornflower') || c.includes('dusty blue') || c.includes('soft blue')) return 'lightblue'
  // Dark blues
  if (c.includes('midnight')) return 'midnight'
  if (c.includes('navy') || c.includes('indigo') || c.includes('dark blue')) return 'navy'
  // Mid blues
  if (c.includes('cobalt') || c.includes('electric blue') || c.includes('royal blue')) return 'cobalt'
  if (c.includes('blue') || c.includes('french blue')) return 'blue'
  // Greys — specific before generic
  if (c.includes('charcoal') || c.includes('anthracite') || c.includes('dark grey') || c.includes('dark gray')) return 'charcoal'
  if (c.includes('slate')) return 'slate'
  if (c.includes('dove')) return 'dovegrey'
  if (c.includes('gunmetal') || c.includes('pewter')) return 'gunmetal'
  if (c.includes('grey') || c.includes('gray') || c.includes('silver')) return 'grey'
  if (c.includes('black') || c.includes('onyx') || c.includes('ebony')) return 'black'
  // Browns — specific before generic
  if (c.includes('chocolate') || c.includes('espresso') || c.includes('dark brown')) return 'chocolate'
  if (c.includes('caramel')) return 'caramel'
  if (c.includes('camel')) return 'camel'
  if (c.includes('tan') || c.includes('khaki')) return 'tan'
  if (c.includes('fawn') || c.includes('buff')) return 'fawn'
  if (c.includes('wheat') || c.includes('straw')) return 'wheat'
  if (c.includes('copper') || c.includes('bronze')) return 'copper'
  if (c.includes('brown') || c.includes('walnut')) return 'brown'
  // Greens — specific before generic
  if (c.includes('bottle') || c.includes('racing green')) return 'bottle'
  if (c.includes('forest') || c.includes('hunter') || c.includes('dark green')) return 'forestgreen'
  if (c.includes('sage')) return 'sage'
  if (c.includes('moss')) return 'moss'
  if (c.includes('olive') || c.includes('army green') || c.includes('military')) return 'olive'
  if (c.includes('jade')) return 'jade'
  if (c.includes('teal') || c.includes('petrol')) return 'teal'
  if (c.includes('green') || c.includes('emerald') || c.includes('mint')) return 'green'
  // Reds — specific before generic
  if (c.includes('scarlet') || c.includes('crimson') || c.includes('vermillion')) return 'scarlet'
  if (c.includes('oxblood')) return 'oxblood'
  if (c.includes('burgundy') || c.includes('claret') || c.includes('dark red')) return 'burgundy'
  if (c.includes('wine') || c.includes('maroon')) return 'wine'
  if (c.includes('terracotta') || c.includes('clay')) return 'terracotta'
  if (c.includes('coral') || c.includes('salmon')) return 'coral'
  if (c.includes('rust') || c.includes('burnt sienna')) return 'rust'
  if (c.includes('red') || c.includes('orange')) return 'red'
  // Pinks & purples
  if (c.includes('blush') || c.includes('dusty pink') || c.includes('pale pink') || c.includes('soft pink')) return 'blush'
  if (c.includes('pink') || c.includes('rose')) return 'pink'
  if (c.includes('aubergine') || c.includes('eggplant') || c.includes('plum') || c.includes('deep purple')) return 'aubergine'
  if (c.includes('lavender') || c.includes('lilac') || c.includes('pale purple')) return 'lavender'
  if (c.includes('purple') || c.includes('violet')) return 'purple'
  // Yellows & neutrals
  if (c.includes('mustard') || c.includes('gold') || c.includes('golden')) return 'mustard'
  if (c.includes('champagne')) return 'champagne'
  if (c.includes('ecru') || c.includes('parchment')) return 'ecru'
  if (c.includes('cream') || c.includes('ivory')) return 'cream'
  if (c.includes('white') || c.includes('oyster') || c.includes('off-white')) return 'white'
  if (c.includes('beige') || c.includes('sand') || c.includes('taupe')) return 'beige'
  return claudeColor
}

const hexToRgb = (hex) => {
  const clean = String(hex || '').trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

const colorMetricsFromHex = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const { r, g, b } = rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return {
    ...rgb,
    luma: r * 0.299 + g * 0.587 + b * 0.114,
    chroma: max - min,
    greenLead: g - Math.max(r, b),
  }
}

const apiErrorMessage = (errData, status) => {
  if (typeof errData?.error === 'string') return errData.error
  if (typeof errData?.error?.message === 'string') return errData.error.message
  if (typeof errData?.message === 'string') return errData.message
  return 'API error: ' + status
}

const parseClaudeJson = (rawText, context) => {
  const fence = String.fromCharCode(96, 96, 96)
  const cleanText = String(rawText || "")
    .replaceAll(fence + "json", "")
    .replaceAll(fence, "")
    .trim()
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
  const jsonText = jsonMatch ? jsonMatch[0] : cleanText
  const sanitized = jsonText
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  try {
    return JSON.parse(sanitized)
  } catch (err) {
    console.warn(`[Dapper ${context}] JSON parse failed`, err, rawText)
    const preview = String(rawText || "").slice(0, 220).trim()
    throw new Error(`${context} returned unreadable JSON${preview ? `: ${preview}` : ": empty response"}`)
  }
}

const GREENISH_COLOR_KEYS = new Set(['olive', 'green', 'forestgreen', 'bottle', 'sage', 'moss', 'jade'])
const NEUTRAL_SUIT_COLOR_KEYS = new Set(['black', 'charcoal', 'grey', 'gunmetal', 'slate', 'midnight', 'navy'])
const GREENISH_COLOR_TEXT = /\b(olive|green|forest|hunter|bottle|moss|sage|jade|emerald|racing green|army green|military)\b/i

const isGreenishSuitRead = (piece) => {
  if (!piece?.visible) return false
  return GREENISH_COLOR_KEYS.has(piece.color) || GREENISH_COLOR_TEXT.test(piece.colorLabel || "")
}

const isDarkNeutralMetrics = (metrics) => {
  if (!metrics) return false
  return metrics.luma < 58 && metrics.chroma < 30 && metrics.greenLead < 16
}

const isNeutralSuitRead = (piece) => {
  if (!piece?.visible) return false
  return NEUTRAL_SUIT_COLOR_KEYS.has(piece.color)
}

const shouldTrustSuitColorAudit = (firstPass, audit) => {
  if (!isGreenishSuitRead(firstPass) || !audit?.visible) return false
  if (isNeutralSuitRead(audit)) return true
  return isDarkNeutralMetrics(colorMetricsFromHex(audit.colorHex))
}

const inferPatternFromText = (value) => {
  const inferred = normalizePattern(value)
  return inferred === 'solid' ? null : inferred
}

const inferFabricFromText = (value) => {
  const text = String(value || '').toLowerCase()
  if (text.includes('worsted')) return 'worsted wool'
  if (text.includes('flannel')) return 'flannel'
  if (text.includes('tweed')) return 'tweed'
  if (text.includes('linen')) return 'linen'
  if (text.includes('cotton')) return 'cotton'
  if (text.includes('wool')) return 'wool'
  return null
}

const correctNearBlackSuitColor = (piece) => {
  if (!piece?.visible) return piece
  const metrics = colorMetricsFromHex(piece.colorHex)
  if (!metrics || !isGreenishSuitRead(piece)) return piece

  const veryDark = metrics.luma < 36
  const darkNeutral = isDarkNeutralMetrics(metrics)
  if (!veryDark && !darkNeutral) return piece

  const corrected = metrics.luma < 32 ? 'black' : 'charcoal'
  return {
    ...piece,
    color: corrected,
    colorLabel: corrected === 'black' ? 'Black' : 'Charcoal Grey',
    colorCorrectionNote: `Auto-corrected from ${piece.colorLabel || piece.color} because the suit color was very dark/neutral.`,
    confidence: Math.min(piece.confidence || 0.5, 0.72),
  }
}

const SUPPORTED_VISION_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const normalizeVisionMediaType = (file) => {
  const type = String(file?.type || '').toLowerCase()
  if (type === 'image/jpg' || type === 'image/pjpeg') return 'image/jpeg'
  if (SUPPORTED_VISION_MEDIA_TYPES.has(type)) return type

  const name = String(file?.name || '').toLowerCase()
  if (/\.(jpg|jpeg)$/.test(name)) return 'image/jpeg'
  if (/\.png$/.test(name)) return 'image/png'
  if (/\.webp$/.test(name)) return 'image/webp'
  if (/\.gif$/.test(name)) return 'image/gif'
  if (/\.(heic|heif)$/.test(name) || type.includes('heic') || type.includes('heif')) return 'image/heic'
  return type || null
}

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = (event) => resolve(event.target?.result)
  reader.onerror = () => reject(new Error('Could not read the selected image file.'))
  reader.readAsDataURL(file)
})

const fileToRawVisionImage = async (file) => {
  const mediaType = normalizeVisionMediaType(file)
  if (!mediaType) {
    throw new Error('This image format is missing a readable file type. Please upload a JPG, PNG, or WebP photo.')
  }
  if (!SUPPORTED_VISION_MEDIA_TYPES.has(mediaType)) {
    throw new Error('This looks like a HEIC/HEIF photo. The AI analyzer needs JPG, PNG, WebP, or GIF. Please export the photo as JPG or take it again using a compatible camera format.')
  }

  const dataURL = await readFileAsDataURL(file)
  const base64 = String(dataURL || '').split(',')[1]
  if (!base64) throw new Error('Could not read image data from the selected file.')
  return { base64, mediaType, source: 'raw' }
}

const fileToVisionImage = (file, options = {}) => {
  const {
    maxSize = 800,
    quality = 0.7,
    outputType = 'image/jpeg',
    allowRawFallback = true,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    const fallbackToRaw = () => {
      if (!allowRawFallback) {
        reject(new Error('Could not create a compatible preview image from the selected file.'))
        return
      }
      fileToRawVisionImage(file).then(resolve).catch(reject)
    }
    img.onload = () => {
      try {
        let w = img.width, h = img.height
        if (!w || !h) throw new Error('The selected image has no readable dimensions.')
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
          else { w = Math.round(w * maxSize / h); h = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        const dataURL = canvas.toDataURL(outputType, quality)
        const base64 = dataURL.split(',')[1]
        if (!base64) throw new Error('Could not compress the selected image.')
        const mediaType = dataURL.slice(5, dataURL.indexOf(';')) || outputType
        resolve({ base64, mediaType, source: 'canvas', maxSize })
      } catch (err) {
        URL.revokeObjectURL(url)
        fallbackToRaw()
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      fallbackToRaw()
    }
    img.src = url
  })
}

const isImageProcessingError = (message) => /could not process image|invalid image|unsupported image/i.test(String(message || ''))

const requestFullLookAnalysis = async (visionImage) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2400,
      system: VISION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: visionImage.mediaType, data: visionImage.base64 } },
        { type: "text", text: FULL_LOOK_USER_PROMPT },
      ]}],
    }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(apiErrorMessage(errData, response.status))
  }
  return response.json()
}

const auditSuitColorWithVision = async (visionImage, firstPassColor) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      system: SUIT_COLOR_AUDIT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: visionImage.mediaType, data: visionImage.base64 } },
        { type: "text", text: SUIT_COLOR_AUDIT_PROMPT(firstPassColor) },
      ]}],
    }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(apiErrorMessage(errData, response.status))
  }
  const data = await response.json()
  const rawText = data.content?.[0]?.text || ""
  return parseClaudeJson(rawText, 'Suit Color Audit')
}

export function useClaudeVision() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [rawResult, setRawResult] = useState(null)

  const analyzeOutfit = useCallback(async (imageFile) => {
    setIsAnalyzing(true)
    setError(null)
    setRawResult(null)
    try {
      console.log('[Dapper Vision] imageFile:', imageFile, typeof imageFile)
      if (!imageFile) throw new Error('No image file provided')
      const visionImage = await fileToVisionImage(imageFile)
      console.log('[Dapper Vision] base64 length:', visionImage.base64?.length, 'media:', visionImage.mediaType)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: VISION_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: visionImage.mediaType, data: visionImage.base64 } },
            { type: 'text', text: VISION_USER_PROMPT },
          ]}],
        }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(apiErrorMessage(errData, response.status))
      }
      const data = await response.json()
      const rawText = data.content?.[0]?.text || ''
      const parsed = parseClaudeJson(rawText, 'Suit Photo')
      setRawResult(parsed)
      console.log('[Dapper RAW] Claude says suit color:', parsed.suit?.color, '| normalized:', parsed.suit?.color ? parsed.suit.color.toLowerCase() : 'none')
      const result = {
        raw: parsed,
        suit: parsed.suit?.visible !== false ? { color: normalizeColor(parsed.suit?.color), colorLabel: parsed.suit?.color || 'Unknown', colorHex: parsed.suit?.colorHex || '#1a2744', pattern: normalizePattern(parsed.suit?.pattern), patternLabel: parsed.suit?.pattern || 'Unknown', fabric: parsed.suit?.fabric || 'Unknown', lapel: parsed.suit?.lapel || 'notch', confidence: parsed.suit?.confidence || 0.5, visible: true } : { visible: false },
        shirt: parsed.shirt?.visible !== false ? { color: normalizeColor(parsed.shirt?.color), colorLabel: parsed.shirt?.color || 'Unknown', colorHex: parsed.shirt?.colorHex || '#f8f6f2', pattern: normalizePattern(parsed.shirt?.pattern), patternLabel: parsed.shirt?.pattern || 'Unknown', fabric: parsed.shirt?.fabric || 'Unknown', collar: parsed.shirt?.collar || 'spread', confidence: parsed.shirt?.confidence || 0.5, visible: true } : { visible: false },
        tie: parsed.tie?.visible !== false ? { color: normalizeColor(parsed.tie?.color), colorLabel: parsed.tie?.color || 'Unknown', colorHex: parsed.tie?.colorHex || '#2c1a4a', pattern: normalizePattern(parsed.tie?.pattern), patternLabel: parsed.tie?.pattern || 'Unknown', material: parsed.tie?.material || 'silk', confidence: parsed.tie?.confidence || 0.5, visible: true } : { visible: false },
        pocketSquare: parsed.pocketSquare?.visible ? { color: normalizeColor(parsed.pocketSquare?.color), colorLabel: parsed.pocketSquare?.color || 'Unknown', colorHex: parsed.pocketSquare?.colorHex || '#f8f6f2', pattern: normalizePattern(parsed.pocketSquare?.pattern), patternLabel: parsed.pocketSquare?.pattern || 'Unknown', fold: parsed.pocketSquare?.fold || 'presidential', confidence: parsed.pocketSquare?.confidence || 0.5, visible: true } : { visible: false },
        imageQuality: parsed.imageQuality || 'unknown',
        lighting: parsed.lighting || 'unknown',
        notes: parsed.notes || '',
        overallConfidence: (() => {
          const v = [parsed.suit, parsed.shirt, parsed.tie, parsed.pocketSquare].filter(i => i?.visible !== false && i?.confidence)
          return v.length ? v.reduce((s, i) => s + i.confidence, 0) / v.length : 0.5
        })(),
      }
      setIsAnalyzing(false)
      return { success: true, data: result }
    } catch (err) {
      console.error('[Dapper Vision] Error:', err)
      setError(err.message)
      setIsAnalyzing(false)
      return { success: false, error: err.message, data: null }
    }
  }, [])

  const analyzeText = useCallback(async (userText) => {
    setIsAnalyzing(true)
    setError(null)
    try {
      if (!userText || !userText.trim()) throw new Error('No text provided')
      console.log('[Dapper Text] Parsing:', userText.substring(0, 80))
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 250,
          system: TEXT_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: TEXT_USER_PROMPT(userText) }],
        }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(apiErrorMessage(errData, response.status))
      }
      const data = await response.json()
      const rawText = data.content?.[0]?.text || ''
      const parsed = parseClaudeJson(rawText, 'Text Parser')
      console.log('[Dapper Text] Parsed:', parsed)
      const suit = parsed.suit || parsed
      const colorKey = normalizeColor(suit.color) || 'navy'
      const patternKey = (suit.pattern || 'solid').toLowerCase().replace(/ /g, '_')
      const fabric = suit.fabric || 'worsted wool'
      const tie = parsed.tie || null
      const shirt = parsed.shirt || null
      const assessment = parsed.assessment || null
      console.log('[Dapper Text] Combo:', { colorKey, patternKey, tie, shirt, assessment })
      setIsAnalyzing(false)
      return { success: true, colorKey, patternKey, fabric, tie, shirt, assessment }
    } catch (err) {
      console.error('[Dapper Text] Error:', err)
      setError(err.message)
      setIsAnalyzing(false)
      return { success: false, colorKey: null, patternKey: null, fabric: null }
    }
  }, [])

  const analyzeFullLook = useCallback(async (imageFile) => {
    setIsAnalyzing(true)
    setError(null)
    setRawResult(null)
    try {
      if (!imageFile) throw new Error("No image file provided")
      const visionImage = await fileToVisionImage(imageFile)
      let data
      try {
        data = await requestFullLookAnalysis(visionImage)
      } catch (primaryErr) {
        if (!isImageProcessingError(primaryErr.message)) throw primaryErr
        if (visionImage.source === 'raw') {
          throw new Error('Could not process image. Please export this photo as JPG or PNG and upload that version.')
        }
        try {
          const retryImage = await fileToVisionImage(imageFile, {
            maxSize: 512,
            quality: 0.55,
            outputType: 'image/png',
            allowRawFallback: false,
          })
          data = await requestFullLookAnalysis(retryImage)
        } catch (retryErr) {
          throw new Error(`${retryErr.message}. Retried with a smaller PNG version and the API still could not process it.`)
        }
      }
      const rawText = data.content?.[0]?.text || ""
      const parsed = parseClaudeJson(rawText, 'Full Look')
      setRawResult(parsed)

      const isVisible = (piece) => piece && piece.visible !== false && (piece.color || piece.pattern || piece.fabric || piece.material || piece.style)
      const normalizeDetectedPiece = (piece, fallbackHex, role) => {
        const colorText = piece?.color || ""
        const inferredPattern = role === "suit" ? inferPatternFromText(colorText) : null
        const patternText = piece?.pattern || inferredPattern || "solid"
        const fabricText = piece?.fabric || piece?.material || piece?.style || inferFabricFromText(colorText) || "Unknown"
        const normalized = isVisible(piece) ? {
        color: normalizeColor(colorText),
        colorLabel: colorText || "Unknown",
        colorHex: piece.colorHex || fallbackHex,
        pattern: normalizePattern(patternText),
        patternLabel: patternText,
        fabric: fabricText,
        lapel: piece.lapel,
        collar: piece.collar,
        fold: piece.fold,
        style: piece.style,
        material: piece.material,
        confidence: piece.confidence || 0.5,
        visible: true,
        } : { visible: false }
        return role === "suit" ? correctNearBlackSuitColor(normalized) : normalized
      }

      const score = Number(parsed.fashionPolice?.score)
      let fashionPolice = {
        approved: Boolean(parsed.fashionPolice?.approved),
        score: Number.isFinite(score) ? Math.max(0, Math.min(10, score)) : null,
        verdict: parsed.fashionPolice?.verdict || "Fashion Police Review",
        assessment: parsed.fashionPolice?.assessment || parsed.notes || "Dapper reviewed the visible outfit elements.",
        strengths: Array.isArray(parsed.fashionPolice?.strengths) ? parsed.fashionPolice.strengths : [],
        recommendations: Array.isArray(parsed.fashionPolice?.recommendations) ? parsed.fashionPolice.recommendations : [],
        priorityFix: parsed.fashionPolice?.priorityFix || null,
      }

      let detectedSuit = normalizeDetectedPiece(parsed.suit, "#1a2744", "suit")
      const firstPassSuitLabel = detectedSuit.colorLabel || parsed.suit?.color || "unknown"
      if (isGreenishSuitRead(detectedSuit)) {
        try {
          const audited = await auditSuitColorWithVision(visionImage, firstPassSuitLabel)
          const auditedSuit = normalizeDetectedPiece(audited, detectedSuit.colorHex, "suit")
          if (shouldTrustSuitColorAudit(detectedSuit, auditedSuit)) {
            const patternLabel = auditedSuit.patternLabel && auditedSuit.patternLabel !== "solid"
              ? auditedSuit.patternLabel
              : detectedSuit.patternLabel
            const fabric = auditedSuit.fabric && auditedSuit.fabric !== "Unknown" ? auditedSuit.fabric : detectedSuit.fabric
            detectedSuit = {
              ...detectedSuit,
              color: auditedSuit.color,
              colorLabel: auditedSuit.colorLabel,
              colorHex: auditedSuit.colorHex || detectedSuit.colorHex,
              pattern: auditedSuit.pattern || detectedSuit.pattern,
              patternLabel,
              fabric,
              confidence: auditedSuit.confidence || detectedSuit.confidence,
              colorCorrectionNote: `Suit color rechecked by API: ${firstPassSuitLabel} -> ${auditedSuit.colorLabel}.`,
            }
            fashionPolice = {
              ...fashionPolice,
              score: null,
              verdict: "Corrected Fashion Police Review",
              assessment: `Rechecked using corrected suit color: ${auditedSuit.colorLabel}.`,
              strengths: [],
              recommendations: [],
              priorityFix: null,
            }
          }
        } catch (auditErr) {
          console.warn("[Dapper Full Look] Suit color audit failed; keeping first pass", auditErr)
        }
      }

      const result = {
        raw: parsed,
        suit: detectedSuit,
        shirt: normalizeDetectedPiece(parsed.shirt, "#f8f6f2", "shirt"),
        tie: normalizeDetectedPiece(parsed.tie, "#2c1a4a", "tie"),
        pocketSquare: normalizeDetectedPiece(parsed.pocketSquare, "#f8f6f2", "pocketSquare"),
        shoes: normalizeDetectedPiece(parsed.shoes, "#1a1a1a", "shoes"),
        belt: normalizeDetectedPiece(parsed.belt, "#3a2417", "belt"),
        fashionPolice,
        imageQuality: parsed.imageQuality || "unknown",
        lighting: parsed.lighting || "unknown",
        notes: [parsed.notes, detectedSuit.colorCorrectionNote].filter(Boolean).join(" "),
      }
      setIsAnalyzing(false)
      return { success: true, data: result }
    } catch (err) {
      console.error("[Dapper Full Look] Error:", err)
      setError(err.message)
      setIsAnalyzing(false)
      return { success: false, error: err.message, data: null }
    }
  }, [])

  const generateExoticAnalysis = useCallback(async (description, colorKey, patternKey) => {
    setIsAnalyzing(true)
    setError(null)
    try {
      console.log('[Dapper Exotic] Generating for:', colorKey, patternKey)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          system: 'You are a menswear expert. Return ONLY raw JSON, no markdown, no backticks. Generate shirt and tie recommendations for an unusual suit combination.',
          messages: [{ role: 'user', content: `Generate recommendations for a ${colorKey} ${patternKey.replace(/_/g," ")} suit. Return this EXACT JSON structure:
{"suit":{"colorFamily":"string","fabric":"string","pattern":"string","formality":"string","lapel":"string","fit":"string"},"shirts":[{"id":1,"name":"string","colorCode":"#hex","why":"string","collar":"string","pattern":"string","pocketSquare":{"name":"string","fold":"string","material":"string"},"ties":[{"id":1,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"},{"id":2,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"},{"id":3,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"}]},{"id":2,"name":"string","colorCode":"#hex","why":"string","collar":"string","pattern":"string","pocketSquare":{"name":"string","fold":"string","material":"string"},"ties":[{"id":1,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"},{"id":2,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"},{"id":3,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"}]},{"id":3,"name":"string","colorCode":"#hex","why":"string","collar":"string","pattern":"string","pocketSquare":{"name":"string","fold":"string","material":"string"},"ties":[{"id":1,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"},{"id":2,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"},{"id":3,"name":"string","color":"#hex","pattern":"string","material":"string","width":"3in","knot":"string","harmony":"string","why":"string"}]}],"packages":[{"name":"string","suit":"string","shirt":"string","tie":"string","pocketSquare":"string","shoes":"string","belt":"string","socks":"string","watch":"string","occasion":"string","archetype":"string","confidence":3,"tip":"string","shirtColor":"#hex","tieColor":"#hex"},{"name":"string","suit":"string","shirt":"string","tie":"string","pocketSquare":"string","shoes":"string","belt":"string","socks":"string","watch":"string","occasion":"string","archetype":"string","confidence":4,"tip":"string","shirtColor":"#hex","tieColor":"#hex"},{"name":"string","suit":"string","shirt":"string","tie":"string","pocketSquare":"string","shoes":"string","belt":"string","socks":"string","watch":"string","occasion":"string","archetype":"string","confidence":3,"tip":"string","shirtColor":"#hex","tieColor":"#hex"}],"styleMantra":"string"}
Use professional menswear vocabulary. Be specific with hex colors. User description: "${description}"` }],
        }),
      })
      if (!response.ok) throw new Error('API error: ' + response.status)
      const data = await response.json()
      const rawText = data.content?.[0]?.text || ''
      const cleanText = rawText
        .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : cleanText
      // Sanitize common Claude JSON mistakes before parsing
      const sanitized = jsonStr
        .replace(/,\s*([}\]])/g, '$1')           // trailing commas
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // control chars
        .replace(/"([^"]*)"\s*:/g, (m, k) => `"${k}":`) // normalize keys
      let parsed
      try {
        parsed = JSON.parse(sanitized)
      } catch(parseErr) {
        // Last resort: extract just shirts and packages arrays
        console.warn('[Dapper Exotic] Full parse failed, trying extraction...')
        const suitM = sanitized.match(/"suit"\s*:\s*(\{[^{}]*\})/)
        const shirtsM = sanitized.match(/"shirts"\s*:\s*(\[[\s\S]*?\])\s*,\s*"packages"/)
        const packagesM = sanitized.match(/"packages"\s*:\s*(\[[\s\S]*?\])\s*,?\s*"styleMantra"/)
        const mantraM = sanitized.match(/"styleMantra"\s*:\s*"([^"]*)"/)
        if (!shirtsM) throw parseErr
        parsed = {
          suit: suitM ? JSON.parse(suitM[1]) : { colorFamily: "green", fabric: "wool", pattern: "houndstooth", formality: "business casual", lapel: "notch", fit: "classic" },
          shirts: JSON.parse(shirtsM[1]),
          packages: packagesM ? JSON.parse(packagesM[1]) : [],
          styleMantra: mantraM ? mantraM[1] : "Command the room with confidence."
        }
      }
      if (parsed?.suit && parsed?.shirts) {
        console.log('[Dapper Exotic] Success — AI generated', parsed.shirts.length, 'shirts')
        setIsAnalyzing(false)
        return parsed
      }
      throw new Error('Invalid response structure')
    } catch (err) {
      console.error('[Dapper Exotic] Error:', err)
      setError(err.message)
      setIsAnalyzing(false)
      return null
    }
  }, [])

  return { analyzeOutfit, analyzeFullLook, analyzeText, generateExoticAnalysis, isAnalyzing, error, rawResult, clearError: () => setError(null) }
}

export { normalizeColor, normalizePattern }
