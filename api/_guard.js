// Shared request guards for the /api endpoints. Underscore prefix keeps
// Vercel from deploying this file as an endpoint.
//
// In-memory, per-instance rate limiting: serverless instances don't share
// state, so this is burst friction, not a hard distributed limit. Good
// enough to blunt naive loops; upgrade to Upstash/KV or Firebase App Check
// for a real distributed limit (owner decision pending).

const buckets = new Map()

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now - bucket.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 })
    return { allowed: true, remaining: limit - 1 }
  }
  bucket.count += 1
  if (buckets.size > 10000) buckets.clear() // memory backstop
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) }
}

export function clientIp(headers) {
  // Vercel sets x-forwarded-for; first hop is the client.
  const get = typeof headers.get === "function"
    ? (k) => headers.get(k)
    : (k) => headers[k]
  const fwd = get("x-forwarded-for") || get("x-real-ip") || ""
  return String(fwd).split(",")[0].trim() || "unknown"
}

// Origin policy: browsers ALWAYS send an Origin header on POST (fetch spec),
// so a missing Origin means a non-browser client — reject for these
// browser-only endpoints. The old blanket `*.vercel.app` allowance let any
// stranger's Vercel deployment use the API from its visitors' browsers;
// same-origin already covers this project's preview deployments, so the
// wildcard is gone.
export function originAllowed({ origin, host, allowedOriginsEnv }) {
  if (!origin) return false
  if (origin === `https://${host}` || origin === `http://${host}`) return true
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true
  const envList = String(allowedOriginsEnv || "").split(",").map((o) => o.trim()).filter(Boolean)
  return envList.includes(origin)
}
