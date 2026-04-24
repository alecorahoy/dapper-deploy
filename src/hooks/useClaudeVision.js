import { useState, useCallback } from 'react'
import { prepareVisionImageFile } from '../utils/imageFiles.js'

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
  "outfitDetected": true,
  "notOutfitReason": null,
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
- If the image is a screenshot, chat app, chart, UI, document, food, landscape, or any non-outfit image, do NOT invent garments. Return outfitDetected:false, notOutfitReason with a short explanation, all garments visible:false, and fashionPolice score:null.
- Analyze only real clothing worn by a visible person. Do not infer a suit, shirt, tie, or pocket square from icons, avatars, app screenshots, text, charts, or background colors.
- Preserve exact garment relationships. Do not let a tie color become the suit color.
- Keep color, pattern, and fabric separate. For example, use color:"black", pattern:"herringbone", fabric:"worsted wool" instead of color:"black herringbone worsted wool".
- Suit color discipline: call the suit olive/green ONLY when the main suit panels clearly have a green hue. Do not label black wool as olive because of warm indoor light, shadows, camera white balance, or a yellow/green cast.
- If the suit is near-black, jet black, tuxedo black, or a very dark neutral, use "black" or "charcoal". If uncertain between black and green, choose black/charcoal and lower confidence.
- Evaluate suit/shirt/tie/pocket square harmony, pattern scale, color contrast, formality, and whether the pocket square matches too closely.
- If an item is not visible, set visible:false for that item.
- score must be 0-10.
- Keep strengths and recommendations to 1-2 short items each. Keep assessment to one short sentence.
- Be specific and practical. Return ONLY JSON.`

const normalizeStyleProfile = (styleProfile) => {
  if (!styleProfile || typeof styleProfile !== 'object') return null
  const label = String(styleProfile.label || '').slice(0, 80).trim()
  const prompt = String(styleProfile.prompt || '').slice(0, 900).trim()
  if (!label || !prompt) return null
  return { label, prompt }
}

const stylePromptBlock = (styleProfile) => {
  const profile = normalizeStyleProfile(styleProfile)
  if (!profile) return ''
  return [
    '',
    'STYLE LENS:',
    `- Judge the final fashionPolice assessment through this lens: ${profile.label}.`,
    `- ${profile.prompt}`,
    '- The style lens affects approval, score, assessment, strengths, and recommendations only.',
    '- The style lens must NOT change objective garment detection. Preserve the actual suit, shirt, tie, pocket square, shoe, and belt colors/patterns exactly as seen.',
  ].join('\n')
}

const fullLookPromptForStyle = (styleProfile) => `${FULL_LOOK_USER_PROMPT}${stylePromptBlock(styleProfile)}`

const SUIT_COLOR_AUDIT_SYSTEM_PROMPT = `You are a strict menswear photo color auditor. Your only job is to re-check the suit jacket/trouser color from the image, ignoring shirt, tie, pocket square, background, lighting cast, and shadows. Return ONLY valid JSON.`

const FULL_LOOK_PREFLIGHT_SYSTEM_PROMPT = `You are an image intake classifier for a menswear outfit analyzer. Your job is only to decide whether the image is a real photo of a visible person wearing menswear clothing. Return ONLY valid JSON.`

const FULL_LOOK_PREFLIGHT_PROMPT = `Classify this image before outfit analysis.

Return outfitPhoto:true ONLY if this is a real photo of a visible person wearing clothing that can be analyzed as an outfit.

Return outfitPhoto:false if the image is:
- a screenshot of Discord, chat, app UI, a website, a document, a chart, text, food, landscape, or a meme
- mostly text or UI
- only an icon/avatar/cartoon/profile image
- a screenshot that merely contains a tiny avatar or background clothing-like shapes

Important exception: a screenshot of an actual outfit photo is acceptable ONLY if a real person wearing clothing is the main subject and fills a meaningful part of the image.

Return ONLY this JSON:
{
  "outfitPhoto": false,
  "visiblePerson": false,
  "screenshotOrUi": true,
  "reason": "This appears to be a Discord chat screenshot, not a real outfit photo.",
  "confidence": 0.98
}`

const SUIT_COLOR_AUDIT_PROMPT = (firstPassColor) => `Re-check ONLY the suit color in this full outfit photo.

The first pass said the suit was "${firstPassColor || "unknown"}". Audit that result carefully.

Rules:
- Focus on the largest suit panels only: jacket body, lapels, sleeves, and trousers if visible.
- Ignore the tie, shirt, pocket square, wall, carpet, indoor light, and camera white balance.
- If the suit reads black, near-black, tuxedo black, or dark neutral under warm/greenish lighting, return "black" or "charcoal".
- Call it olive/green ONLY if the cloth itself clearly has a green hue in the main suit panels.
- Call it brown ONLY if the cloth itself clearly has a brown hue in the main suit panels.
- If you are uncertain between brown or olive/green and black/charcoal because of warm indoor light, shadows, or color cast, choose black/charcoal and lower confidence.
- Use "charcoal" only when the cloth is visibly gray. If it is nearly black or reads as a black suit in normal menswear language, use "black".
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

const TEXT_USER_PROMPT = (userText, styleProfile) => [
  "Extract ALL garments mentioned from this description. Preserve exact garment relationships: suit color must come from the color attached to the suit, shirt color from the shirt, and tie color/pattern from the tie. Do not let a tie color change the suit color.",
  "",
  "Map suit color to the closest family: black, charcoal, navy, grey, blue, burgundy, brown, beige, green, white, purple, red, olive, forest green, sage, teal, rust, terracotta, tan, camel. Map suit pattern to: solid, chalk_stripe, glen_plaid, herringbone, tweed, linen, houndstooth, birdseye, seersucker, flannel.",
  "",
  "For ties, preserve multi-color descriptions such as blue and green or red and gold in the tie.color field, and preserve tie patterns such as striped, repp stripe, polka dot, paisley, knit, grenadine, foulard, plaid, solid.",
  "",
  "If a tie or shirt is mentioned, include them. If multiple items are described, provide a brief assessment evaluating the exact combination in 1-2 sentences.",
  stylePromptBlock(styleProfile),
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
const BROWNISH_COLOR_KEYS = new Set(['brown', 'chocolate', 'caramel', 'copper', 'camel', 'tan', 'beige', 'taupe', 'fawn', 'wheat'])
const GREENISH_COLOR_TEXT = /\b(olive|green|forest|hunter|bottle|moss|sage|jade|emerald|racing green|army green|military)\b/i
const BROWNISH_COLOR_TEXT = /\b(brown|chocolate|espresso|walnut|cognac|camel|caramel|copper|bronze|tan|beige|khaki|taupe|fawn|buff|wheat)\b/i

const isGreenishSuitRead = (piece) => {
  if (!piece?.visible) return false
  return GREENISH_COLOR_KEYS.has(piece.color) || GREENISH_COLOR_TEXT.test(piece.colorLabel || "")
}

const isBrownishSuitRead = (piece) => {
  if (!piece?.visible) return false
  return BROWNISH_COLOR_KEYS.has(piece.color) || BROWNISH_COLOR_TEXT.test(piece.colorLabel || "")
}

const isDarkNeutralMetrics = (metrics) => {
  if (!metrics) return false
  return metrics.luma < 58 && metrics.chroma < 30 && metrics.greenLead < 16
}

const isNeutralSuitRead = (piece) => {
  if (!piece?.visible) return false
  return NEUTRAL_SUIT_COLOR_KEYS.has(piece.color)
}

const isSuspiciousDarkSuitRead = (piece) => isGreenishSuitRead(piece) || isBrownishSuitRead(piece)

const shouldTrustSuitColorAudit = (firstPass, audit) => {
  if (!isSuspiciousDarkSuitRead(firstPass) || !audit?.visible) return false
  if (isNeutralSuitRead(audit)) return true
  return isDarkNeutralMetrics(colorMetricsFromHex(audit.colorHex))
}

const preferBlackForGreenishNearBlackAudit = (firstPass, audit) => {
  if (!isSuspiciousDarkSuitRead(firstPass) || !audit?.visible || audit.color !== 'charcoal') return audit
  const metrics = colorMetricsFromHex(audit.colorHex)
  if (!metrics || metrics.luma >= 48 || metrics.chroma >= 26) return audit
  return {
    ...audit,
    color: 'black',
    colorLabel: 'Black',
    confidence: Math.min(audit.confidence || 0.7, 0.82),
  }
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
  if (!metrics || !isSuspiciousDarkSuitRead(piece)) return piece

  const veryDark = metrics.luma < 36
  const darkNeutral = isDarkNeutralMetrics(metrics) && metrics.chroma < 28
  if (!veryDark && !darkNeutral) return piece

  const corrected = metrics.luma < 48 ? 'black' : 'charcoal'
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

const MAX_VISION_BASE64_LENGTH = 3600000

const loadImageFromSrc = (src) => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('Could not decode the selected image.'))
  image.src = src
})

const fileToRawVisionImage = async (file) => {
  const compatibleFile = await prepareVisionImageFile(file)
  const mediaType = normalizeVisionMediaType(compatibleFile)
  if (!mediaType) {
    throw new Error('This image format is missing a readable file type. Please upload a JPG, PNG, or WebP photo.')
  }
  if (!SUPPORTED_VISION_MEDIA_TYPES.has(mediaType)) {
    throw new Error('This looks like a HEIC/HEIF photo. The AI analyzer needs JPG, PNG, WebP, or GIF. Please export the photo as JPG or take it again using a compatible camera format.')
  }

  const dataURL = await readFileAsDataURL(compatibleFile)
  const base64 = String(dataURL || '').split(',')[1]
  if (!base64) throw new Error('Could not read image data from the selected file.')
  if (base64.length > MAX_VISION_BASE64_LENGTH) {
    try {
      const image = await loadImageFromSrc(dataURL)
      return drawDecodedImageToVisionImage(
        image,
        image.width,
        image.height,
        {
          maxSize: 1280,
          quality: 0.68,
          outputType: 'image/jpeg',
          maxBase64Length: Math.round(MAX_VISION_BASE64_LENGTH * 0.88),
        },
        'raw-resized'
      )
    } catch (resizeErr) {
      console.warn('[Dapper Vision] Raw fallback remained large after file read', resizeErr)
    }
  }
  return { base64, mediaType, source: 'raw' }
}

const drawDecodedImageToVisionImage = (image, width, height, options, source) => {
  const { maxSize, quality, outputType, maxBase64Length = MAX_VISION_BASE64_LENGTH } = options
  let w = width, h = height
  if (!w || !h) throw new Error('The selected image has no readable dimensions.')
  if (w > maxSize || h > maxSize) {
    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
    else { w = Math.round(w * maxSize / h); h = maxSize }
  }
  let workingWidth = w
  let workingHeight = h
  let workingQuality = quality
  const minQuality = outputType === 'image/png' ? quality : 0.42
  const minSide = 280

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = workingWidth
    canvas.height = workingHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare the selected image for analysis.')
    ctx.drawImage(image, 0, 0, workingWidth, workingHeight)
    const dataURL = canvas.toDataURL(outputType, workingQuality)
    const base64 = dataURL.split(',')[1]
    if (!base64) throw new Error('Could not compress the selected image.')
    const mediaType = dataURL.slice(5, dataURL.indexOf(';')) || outputType
    if (base64.length <= maxBase64Length) {
      return { base64, mediaType, source, maxSize: Math.max(workingWidth, workingHeight) }
    }

    if (workingQuality > minQuality + 0.04) {
      workingQuality = Math.max(minQuality, workingQuality - 0.08)
      continue
    }

    if (Math.max(workingWidth, workingHeight) <= minSide) {
      return { base64, mediaType, source, maxSize: Math.max(workingWidth, workingHeight) }
    }

    workingWidth = Math.max(1, Math.round(workingWidth * 0.82))
    workingHeight = Math.max(1, Math.round(workingHeight * 0.82))
  }

  throw new Error('Could not compress the selected image to a stable size for analysis.')
}

const fileToBitmapVisionImage = async (file, options) => {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser cannot decode the selected image with createImageBitmap.')
  }
  let bitmap
  try {
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      bitmap = await createImageBitmap(file)
    }
    return drawDecodedImageToVisionImage(bitmap, bitmap.width, bitmap.height, options, 'bitmap')
  } finally {
    bitmap?.close?.()
  }
}

const fileToVisionImage = (file, options = {}) => {
  const {
    maxSize = 800,
    quality = 0.7,
    outputType = 'image/jpeg',
    allowRawFallback = true,
  } = options

  return new Promise(async (resolve, reject) => {
    let compatibleFile = file
    try {
      compatibleFile = await prepareVisionImageFile(file)
    } catch (err) {
      reject(err)
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(compatibleFile)
    const fallbackToRaw = () => {
      if (!allowRawFallback) {
        reject(new Error('Could not create a compatible preview image from the selected file.'))
        return
      }
      fileToRawVisionImage(compatibleFile).then(resolve).catch(reject)
    }
    const fallbackToBitmapOrRaw = () => {
      fileToBitmapVisionImage(compatibleFile, { maxSize, quality, outputType })
        .then(resolve)
        .catch(fallbackToRaw)
    }
    img.onload = () => {
      try {
        const visionImage = drawDecodedImageToVisionImage(img, img.width, img.height, { maxSize, quality, outputType }, 'canvas')
        URL.revokeObjectURL(url)
        resolve(visionImage)
      } catch (err) {
        URL.revokeObjectURL(url)
        fallbackToBitmapOrRaw()
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      fallbackToBitmapOrRaw()
    }
    img.src = url
  })
}

const isImageProcessingError = (message) => /could not process image|invalid image|unsupported image/i.test(String(message || ''))
const isRetryableVisionError = (message) => (
  isImageProcessingError(message) ||
  /too large for the analyzer|payload too large|could not compress/i.test(String(message || ''))
)

const NON_OUTFIT_TEXT_PATTERN = /\b(screenshot|chat|discord|slack|message|ui|interface|screen|chart|graph|document|text|recipe|food|avatar|not an outfit|non-outfit|no person|no visible person|no clothing|not visible)\b/i

const isRejectedByPreflight = (preflight) => {
  if (!preflight) return false
  if (preflight.outfitPhoto === false) return true
  if (preflight.screenshotOrUi === true && preflight.visiblePerson !== true) return true
  return false
}

const isNonOutfitFullLook = (parsed) => {
  if (parsed?.outfitDetected === false) return true
  const visibleMenswearPieces = [parsed?.suit, parsed?.shirt, parsed?.tie, parsed?.pocketSquare]
    .filter((piece) => piece?.visible && piece.confidence !== 0)
  if (visibleMenswearPieces.length > 0) return false
  const text = [
    parsed?.notOutfitReason,
    parsed?.notes,
    parsed?.imageQuality,
    parsed?.fashionPolice?.assessment,
    parsed?.fashionPolice?.verdict,
  ].filter(Boolean).join(' ')
  return NON_OUTFIT_TEXT_PATTERN.test(text)
}

const nonOutfitMessage = (parsed) => {
  const reason = parsed?.reason || parsed?.notOutfitReason || parsed?.notes || 'This does not look like a full outfit photo.'
  return `This does not look like a full outfit photo: ${reason}. Please upload a real photo of the person wearing the suit, shirt, tie, and pocket square.`
}

const requestFullLookPreflight = async (visionImage) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: FULL_LOOK_PREFLIGHT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: visionImage.mediaType, data: visionImage.base64 } },
        { type: "text", text: FULL_LOOK_PREFLIGHT_PROMPT },
      ]}],
    }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(apiErrorMessage(errData, response.status))
  }
  const data = await response.json()
  const rawText = data.content?.[0]?.text || ""
  return parseClaudeJson(rawText, 'Full Look Preflight')
}

const requestFullLookAnalysis = async (visionImage, styleProfile) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2400,
      system: VISION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: visionImage.mediaType, data: visionImage.base64 } },
        { type: "text", text: fullLookPromptForStyle(styleProfile) },
      ]}],
    }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(apiErrorMessage(errData, response.status))
  }
  return response.json()
}

const requestSuitPhotoAnalysis = async (visionImage) => {
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
  return response.json()
}

const runVisionRequestWithFallbacks = async (imageFile, requestFn) => {
  const variants = [
    { label: 'primary', options: {} },
    { label: 'smaller-jpeg', options: { maxSize: 640, quality: 0.6, outputType: 'image/jpeg', allowRawFallback: true } },
    { label: 'smaller-png', options: { maxSize: 512, quality: 0.55, outputType: 'image/png', allowRawFallback: true } },
    { label: 'tiny-jpeg', options: { maxSize: 420, quality: 0.5, outputType: 'image/jpeg', allowRawFallback: true } },
  ]

  const attempts = []
  let lastErr = null
  let lastVariant = null
  let rawSourceSeen = false
  for (const variant of variants) {
    try {
      const visionImage = await fileToVisionImage(imageFile, variant.options)
      // If we already sent raw bytes on the previous attempt and the API rejected
      // them, retrying with raw bytes again (because the browser cannot decode
      // this file) just wastes time. Bail out with a clear error.
      if (visionImage?.source === 'raw' || visionImage?.source === 'raw-resized') {
        if (rawSourceSeen) {
          const reason = lastErr?.message || 'unknown API error'
          throw new Error(
            `The analyzer rejected this photo even at a smaller size, and the browser could not re-encode it locally. File: ${imageFile?.type || 'unknown type'}, ${(imageFile?.size ? Math.round(imageFile.size/1024) : '?')} KB. Server response: ${reason}`
          )
        }
        rawSourceSeen = true
      }
      const data = await requestFn(visionImage)
      return { data, visionImage, variant: variant.label }
    } catch (err) {
      lastErr = err
      lastVariant = variant.label
      attempts.push(`${variant.label}: ${err.message}`)
      if (!isRetryableVisionError(err.message) || variant === variants[variants.length - 1]) break
    }
  }

  console.error('[Dapper Vision] All variants failed', {
    file: imageFile?.name,
    type: imageFile?.type,
    sizeKB: imageFile?.size ? Math.round(imageFile.size / 1024) : null,
    attempts,
  })

  if (lastErr) {
    const sizeKB = imageFile?.size ? `${Math.round(imageFile.size/1024)} KB` : '?'
    throw new Error(`${lastErr.message} [${imageFile?.type || 'unknown'} · ${sizeKB} · last variant: ${lastVariant}]`)
  }
  throw new Error('Could not prepare the selected image for analysis.')
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
      const { data, visionImage } = await runVisionRequestWithFallbacks(imageFile, requestSuitPhotoAnalysis)
      console.log('[Dapper Vision] base64 length:', visionImage.base64?.length, 'media:', visionImage.mediaType)
      const rawText = data.content?.[0]?.text || ''
      const parsed = parseClaudeJson(rawText, 'Suit Photo')
      setRawResult(parsed)
      console.log('[Dapper RAW] Claude says suit color:', parsed.suit?.color, '| normalized:', parsed.suit?.color ? parsed.suit.color.toLowerCase() : 'none')
      const normalizeVisionPiece = (piece, fallbackHex, role) => {
        const normalized = piece?.visible !== false
          ? {
              color: normalizeColor(piece?.color),
              colorLabel: piece?.color || 'Unknown',
              colorHex: piece?.colorHex || fallbackHex,
              pattern: normalizePattern(piece?.pattern),
              patternLabel: piece?.pattern || 'Unknown',
              fabric: piece?.fabric || 'Unknown',
              lapel: piece?.lapel || 'notch',
              collar: piece?.collar || 'spread',
              material: piece?.material || 'silk',
              fold: piece?.fold || 'presidential',
              confidence: piece?.confidence || 0.5,
              visible: true,
            }
          : { visible: false }
        return role === 'suit' ? correctNearBlackSuitColor(normalized) : normalized
      }

      const firstPassSuit = normalizeVisionPiece(parsed.suit, '#1a2744', 'suit')
      let detectedSuit = firstPassSuit
      const firstPassSuitLabel = firstPassSuit.colorLabel || parsed.suit?.color || 'unknown'
      if (isSuspiciousDarkSuitRead(firstPassSuit)) {
        try {
          const audited = await auditSuitColorWithVision(visionImage, firstPassSuitLabel)
          const auditedSuit = preferBlackForGreenishNearBlackAudit(firstPassSuit, normalizeVisionPiece(audited, firstPassSuit.colorHex || '#1a2744', 'suit'))
          if (shouldTrustSuitColorAudit(firstPassSuit, auditedSuit)) {
            detectedSuit = {
              ...firstPassSuit,
              color: auditedSuit.color,
              colorLabel: auditedSuit.colorLabel,
              colorHex: auditedSuit.colorHex || firstPassSuit.colorHex,
              pattern: auditedSuit.pattern || firstPassSuit.pattern,
              patternLabel: auditedSuit.patternLabel || firstPassSuit.patternLabel,
              fabric: auditedSuit.fabric && auditedSuit.fabric !== 'Unknown' ? auditedSuit.fabric : firstPassSuit.fabric,
              confidence: auditedSuit.confidence || firstPassSuit.confidence,
              colorCorrectionNote: `Suit color rechecked by API: ${firstPassSuitLabel} -> ${auditedSuit.colorLabel}.`,
            }
          }
        } catch (auditErr) {
          console.warn('[Dapper Vision] Suit color audit failed; keeping first pass', auditErr)
        }
      }

      const result = {
        raw: parsed,
        suit: detectedSuit,
        shirt: normalizeVisionPiece(parsed.shirt, '#f8f6f2', 'shirt'),
        tie: normalizeVisionPiece(parsed.tie, '#2c1a4a', 'tie'),
        pocketSquare: normalizeVisionPiece(parsed.pocketSquare, '#f8f6f2', 'pocketSquare'),
        imageQuality: parsed.imageQuality || 'unknown',
        lighting: parsed.lighting || 'unknown',
        notes: [parsed.notes, detectedSuit.colorCorrectionNote].filter(Boolean).join(' '),
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

  const analyzeText = useCallback(async (userText, styleProfile = null) => {
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
          max_tokens: 350,
          system: TEXT_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: TEXT_USER_PROMPT(userText, styleProfile) }],
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

  const analyzeFullLook = useCallback(async (imageFile, styleProfile = null) => {
    setIsAnalyzing(true)
    setError(null)
    setRawResult(null)
    try {
      if (!imageFile) throw new Error("No image file provided")
      const { data: preflight, visionImage: preflightVisionImage } = await runVisionRequestWithFallbacks(imageFile, requestFullLookPreflight)
      if (isRejectedByPreflight(preflight)) {
        throw new Error(nonOutfitMessage(preflight))
      }

      let data
      try {
        data = await requestFullLookAnalysis(preflightVisionImage, styleProfile)
      } catch (primaryErr) {
        if (!isRetryableVisionError(primaryErr.message)) throw primaryErr
        const retried = await runVisionRequestWithFallbacks(imageFile, (nextVisionImage) => requestFullLookAnalysis(nextVisionImage, styleProfile))
        data = retried.data
      }
      const rawText = data.content?.[0]?.text || ""
      const parsed = parseClaudeJson(rawText, 'Full Look')
      setRawResult(parsed)
      if (isNonOutfitFullLook(parsed)) {
        throw new Error(nonOutfitMessage(parsed))
      }

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
      if (isSuspiciousDarkSuitRead(detectedSuit)) {
        try {
          const audited = await auditSuitColorWithVision(visionImage, firstPassSuitLabel)
          const auditedSuit = preferBlackForGreenishNearBlackAudit(detectedSuit, normalizeDetectedPiece(audited, detectedSuit.colorHex, "suit"))
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
