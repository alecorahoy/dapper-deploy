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
8. colorHex must be your best estimate of the actual hex color of the garment`

const VISION_USER_PROMPT = `Analyze this outfit photograph. Identify every visible garment and return a JSON object with this EXACT structure:

{
  "suit": { "visible": true, "color": "midnight navy", "colorHex": "#0a0f2e", "pattern": "chalk stripe", "fabric": "worsted wool", "lapel": "notch", "confidence": 0.94 },
  "shirt": { "visible": true, "color": "white", "colorHex": "#f8f6f2", "pattern": "solid", "fabric": "cotton poplin", "collar": "spread", "confidence": 0.91 },
  "tie": { "visible": true, "color": "burgundy", "colorHex": "#6d1a2a", "pattern": "repp stripe", "material": "silk", "confidence": 0.88 },
  "pocketSquare": { "visible": false, "color": null, "colorHex": null, "pattern": null, "fold": null, "confidence": 0 },
  "lighting": "natural daylight", "imageQuality": "good", "notes": "Any important observations"
}

Be precise. Use professional menswear vocabulary. Return ONLY the JSON object.`

const TEXT_SYSTEM_PROMPT = `You extract suit attributes from text descriptions. Return ONLY valid JSON, no markdown, no backticks, no explanation.`

const TEXT_USER_PROMPT = (userText) => `Extract the suit color, pattern, and fabric from this description. Map the color to one of these exact keys: black, charcoal, navy, grey, blue, burgundy, brown, beige. Map the pattern to one of these exact keys: solid, chalk_stripe, glen_plaid, herringbone, tweed, linen. If unsure, default to solid.

Return ONLY this JSON:
{"color":"navy","pattern":"solid","fabric":"worsted wool"}

Description: "${userText}"`

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
  if (c.includes('navy') || c.includes('midnight') || c.includes('indigo')) return 'navy'
  if (c.includes('charcoal') || c.includes('slate') || c.includes('anthracite')) return 'charcoal'
  if (c.includes('grey') || c.includes('gray') || c.includes('silver')) return 'grey'
  if (c.includes('black') || c.includes('onyx') || c.includes('ebony')) return 'black'
  if (c.includes('brown') || c.includes('chocolate') || c.includes('espresso') || c.includes('camel') || c.includes('tan') || c.includes('khaki') || c.includes('caramel')) return 'brown'
  if (c.includes('blue') || c.includes('cobalt') || c.includes('french blue') || c.includes('sky')) return 'blue'
  if (c.includes('green') || c.includes('olive') || c.includes('forest') || c.includes('sage') || c.includes('moss')) return 'green'
  if (c.includes('burgundy') || c.includes('wine') || c.includes('claret') || c.includes('oxblood')) return 'burgundy'
  if (c.includes('white') || c.includes('cream') || c.includes('ivory') || c.includes('oyster') || c.includes('ecru')) return 'white'
  if (c.includes('light blue') || c.includes('pale blue') || c.includes('powder')) return 'light blue'
  if (c.includes('beige') || c.includes('sand') || c.includes('taupe')) return 'beige'
  return claudeColor
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const dataURL = canvas.toDataURL('image/jpeg', 0.7)
      resolve(dataURL.split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
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
      const base64Image = await fileToBase64(imageFile)
      console.log('[Dapper Vision] base64 length:', base64Image?.length)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: VISION_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
            { type: 'text', text: VISION_USER_PROMPT },
          ]}],
        }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || 'API error: ' + response.status)
      }
      const data = await response.json()
      const rawText = data.content?.[0]?.text || ''
      const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanText)
      setRawResult(parsed)
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
          max_tokens: 100,
          system: TEXT_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: TEXT_USER_PROMPT(userText) }],
        }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || 'API error: ' + response.status)
      }
      const data = await response.json()
      const rawText = data.content?.[0]?.text || ''
      const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanText)
      console.log('[Dapper Text] Parsed:', parsed)
      const colorKey = normalizeColor(parsed.color) || 'navy'
      const patternKey = (parsed.pattern || 'solid').toLowerCase().replace(/ /g, '_')
      const fabric = parsed.fabric || 'worsted wool'
      setIsAnalyzing(false)
      return { success: true, colorKey, patternKey, fabric }
    } catch (err) {
      console.error('[Dapper Text] Error:', err)
      setError(err.message)
      setIsAnalyzing(false)
      return { success: false, colorKey: null, patternKey: null, fabric: null }
    }
  }, [])

  return { analyzeOutfit, analyzeText, isAnalyzing, error, rawResult, clearError: () => setError(null) }
}

export { normalizeColor, normalizePattern }
