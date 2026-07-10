// Dapper service worker — real PWA caching with a safe update flow.
//
// Strategy:
//   • Navigations (HTML)  → network-first, fall back to cached app shell when
//     offline. This guarantees a fresh app after every deploy (no stale-bundle
//     bug) while still working offline.
//   • Hashed build assets (/assets/*) → cache-first. They are content-hashed and
//     immutable, so this is safe and makes repeat loads instant + offline-capable.
//   • Icons / static files → stale-while-revalidate.
//
// Bump CACHE_VERSION to force-refresh the precache on a new release.

const CACHE_VERSION = "dapper-v2"
const APP_SHELL = [
  "/app.html",
  "/favicon.svg",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Don't fail the whole install if one optional asset 404s.
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("dapper-") && k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // don't touch cross-origin (API, fonts, Anthropic)

  // 1) Navigations → network-first, offline fallback to the cached page.
  // Cache the app shell under "/app.html" ONLY for app routes; cache the
  // landing under its own key — otherwise visiting "/" online would
  // overwrite the app shell and serve the landing to the app when offline.
  if (request.mode === "navigate") {
    const isAppRoute = url.pathname === "/app" || url.pathname === "/app.html" || url.pathname.startsWith("/app/")
    const cacheKey = isAppRoute ? "/app.html" : url.pathname
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(cacheKey, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(cacheKey).then((r) => r || caches.match("/app.html")))
    )
    return
  }

  // 2) Hashed immutable build assets → cache-first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {})
          return res
        })
      )
    )
    return
  }

  // 3) Other same-origin GETs (icons, etc.) → stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {})
        return res
      }).catch(() => cached)
      return cached || network
    })
  )
})

// Allow the page to tell a waiting SW to activate immediately.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting()
})
