export const config = { runtime: 'edge' }

// Only the models the app actually calls may pass through this proxy — without
// this, any caller (esp. non-browser clients with no Origin header) could run
// arbitrary, expensive Anthropic models on the owner's key.
const ALLOWED_MODELS = new Set(['claude-haiku-4-5-20251001'])

// ── CORS origin lock ───────────────────────────────────────────────
// Same-origin app calls (incl. logged-out guests) keep working, but
// off-site browsers can't use this paid AI proxy. Determined non-browser
// clients can still spoof Origin — pair with Firebase App Check later.
function isAllowedOrigin(req) {
  const origin = req.headers.get('origin')
  // No Origin header → same-origin fetch or non-browser; allow.
  if (!origin) return { allowed: true, origin: null }

  const host = req.headers.get('host') || ''
  const sameOrigin = origin === `https://${host}` || origin === `http://${host}`
  const envList = String(process.env.ALLOWED_ORIGINS || '')
    .split(',').map((o) => o.trim()).filter(Boolean)
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)

  const allowed = sameOrigin || isLocal || isVercelPreview || envList.includes(origin)
  return { allowed, origin }
}

function corsHeaders(req) {
  const { origin } = isAllowedOrigin(req)
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}

function collectImagePayloadStats(messages) {
  const stats = { imageCount: 0, largestBase64Length: 0, totalBase64Length: 0, mediaTypes: [] }
  const safeMessages = Array.isArray(messages) ? messages : []

  for (const message of safeMessages) {
    const contentItems = Array.isArray(message?.content) ? message.content : []
    for (const item of contentItems) {
      const source = item?.source
      if (item?.type !== 'image' || !source) continue
      const mediaType = String(source.media_type || 'unknown')
      const dataLength = typeof source.data === 'string' ? source.data.length : 0
      stats.imageCount += 1
      stats.totalBase64Length += dataLength
      stats.largestBase64Length = Math.max(stats.largestBase64Length, dataLength)
      if (!stats.mediaTypes.includes(mediaType)) stats.mediaTypes.push(mediaType)
    }
  }

  return stats
}

export default async function handler(req) {
  const cors = corsHeaders(req)
  const { allowed } = isAllowedOrigin(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors })
  }

  if (!allowed) {
    return new Response(JSON.stringify({ error: { message: 'Origin not allowed.' } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  try {
    // Prefer ANTHROPIC_API_KEY; fall back to the legacy VITE_-prefixed name.
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'Missing ANTHROPIC_API_KEY on the server.' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...cors }
      })
    }

    const body = await req.json()

    if (!ALLOWED_MODELS.has(body?.model)) {
      return new Response(JSON.stringify({ error: { message: 'Model not allowed.' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors }
      })
    }
    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: { message: 'Invalid request.' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors }
      })
    }

    const payloadText = JSON.stringify(body)
    const payloadSize = payloadText.length
    const imageStats = collectImagePayloadStats(body?.messages)

    console.info('[api/analyze] request', JSON.stringify({
      model: body?.model || 'unknown',
      max_tokens: body?.max_tokens || null,
      approxPayloadChars: payloadSize,
      imageCount: imageStats.imageCount,
      largestBase64Length: imageStats.largestBase64Length,
      totalBase64Length: imageStats.totalBase64Length,
      mediaTypes: imageStats.mediaTypes,
    }))

    if (imageStats.largestBase64Length > 3700000 || payloadSize > 4000000) {
      console.warn('[api/analyze] payload rejected before upstream', JSON.stringify({
        approxPayloadChars: payloadSize,
        imageCount: imageStats.imageCount,
        largestBase64Length: imageStats.largestBase64Length,
      }))
      return new Response(JSON.stringify({
        error: {
          message: 'This photo is still too large for the analyzer after optimization. Try a tighter crop, a screenshot of just the outfit, or a lower-resolution JPG.'
        }
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...cors }
      })
    }

    // Cap at 4000 — exotic analysis needs up to 4000 tokens
    if (body.max_tokens > 4000) body.max_tokens = 4000

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body)
    })

    const rawText = await response.text()
    let data
    try { data = rawText ? JSON.parse(rawText) : {} }
    catch { data = { error: { message: rawText || `Upstream HTTP ${response.status} returned no JSON body.` } } }

    if (!response.ok) {
      const upstreamMsg = typeof data?.error?.message === 'string'
        ? data.error.message
        : (typeof data?.error === 'string' ? data.error : (data?.message || `Upstream HTTP ${response.status}`))
      console.error('[api/analyze] upstream error', JSON.stringify({
        status: response.status,
        error: upstreamMsg,
        rawSnippet: rawText.slice(0, 300),
      }))
      // Guarantee the response body has error.message so the client shows a real message
      // instead of a generic "API error: <status>" when Anthropic returns an empty / non-JSON body.
      if (!data?.error || typeof data.error !== 'object' || typeof data.error.message !== 'string') {
        data = { ...(data || {}), error: { message: `${upstreamMsg} (status ${response.status})` } }
      }
    }
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...cors,
      }
    })
  } catch (err) {
    console.error('[api/analyze] handler error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors }
    })
  }
}
