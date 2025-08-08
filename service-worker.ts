const CACHE_NAME = 'cashsplit-v1'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(req)
    if (cached) return cached
    try {
      const res = await fetch(req)
      if (res.ok && req.url.startsWith(self.location.origin)) cache.put(req, res.clone())
      return res
    } catch {
      return cached || Response.error()
    }
  })())
})