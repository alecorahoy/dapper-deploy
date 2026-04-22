export const config = { runtime: 'edge' }

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
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'Missing VITE_ANTHROPIC_API_KEY on the server.' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    const body = await req.json()
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

    if (imageStats.largestBase64Length > 2200000 || payloadSize > 2600000) {
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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

    const data = await response.json()
    if (!response.ok) {
      console.error('[api/analyze] upstream error', JSON.stringify({
        status: response.status,
        error: typeof data?.error?.message === 'string' ? data.error.message : data?.error || data?.message || 'Unknown upstream error',
      }))
    }
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err) {
    console.error('[api/analyze] handler error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
