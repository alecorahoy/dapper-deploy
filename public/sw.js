// Dapper service worker cache reset.
//
// Earlier builds cached /app.html with a cache-first strategy, which could keep
// old app bundles alive after production deploys. This worker clears the old
// Dapper caches and unregisters itself so future deploys load from the network.

self.addEventListener("install", event => {
  self.skipWaiting()
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("dapper-")).map(key => caches.delete(key))))
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("dapper-")).map(key => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then(clients => {
        clients.forEach(client => client.navigate(client.url))
      })
  )
})

self.addEventListener("fetch", () => {
  // Intentionally do nothing. Let the browser hit the network.
})
