// ─────────────────────────────────────────────
// DAPPER — Service Worker
// Enables offline use, fast loads, app install
// ─────────────────────────────────────────────

const CACHE_NAME = "dapper-v1.2"
const STATIC_CACHE = "dapper-static-v1.2"

// Assets to cache on install (app shell)
const PRECACHE_ASSETS = [
  "/",
  "/app",
  "/app.html",
  "/index.html",
  "/favicon.svg",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/apple-touch-icon.svg",
  "/icons/splash.svg",
  "/manifest.json",
]

// External assets to cache (fonts, CDN)
const EXTERNAL_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap",
  "https://cdn.tailwindcss.com",
]

// ── INSTALL: cache all static assets ──
self.addEventListener("install", event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      // Cache internal assets
      const internalPromises = PRECACHE_ASSETS.map(url =>
        cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
      )
      // Cache external assets separately (failures ok)
      const externalPromises = EXTERNAL_ASSETS.map(url =>
        cache.add(url).catch(err => console.warn(`[SW] External cache miss ${url}:`, err))
      )
      return Promise.all([...internalPromises, ...externalPromises])
    })
  )
})

// ── ACTIVATE: clean old caches ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── FETCH: serve from cache, fall back to network ──
self.addEventListener("fetch", event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and browser extensions
  if (request.method !== "GET") return
  if (url.protocol === "chrome-extension:") return

  // API calls (OpenAI) — always network, never cache
  if (url.hostname.includes("openai.com") || url.hostname.includes("anthropic.com")) {
    return event.respondWith(fetch(request))
  }

  // For navigation requests — return app shell
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/app.html").then(cached => cached || fetch(request))
    )
    return
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached

      // Not in cache — fetch and cache it
      return fetch(request)
        .then(response => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type === "error") {
            return response
          }
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone))
          return response
        })
        .catch(() => {
          // Offline fallback for images — return blank svg
          if (request.destination === "image") {
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#0d1627"/></svg>`,
              { headers: { "Content-Type": "image/svg+xml" } }
            )
          }
          // For everything else, try the cached app shell
          return caches.match("/app.html")
        })
    })
  )
})

// ── PUSH NOTIFICATIONS (future feature) ──
self.addEventListener("push", event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || "Dapper", {
      body: data.body || "Style intelligence update",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      data: data.url || "/app",
    })
  )
})

self.addEventListener("notificationclick", event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data || "/app"))
})
