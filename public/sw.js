const CACHE_NAME = 'helm-cache-v1'

// install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME))
  self.skipWaiting() // activate service worker immediately
})

// activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName === CACHE_NAME) return
          return caches.delete(cacheName)
        }),
      )
    }),
  )
  self.clients.claim() // take control of clients immediately
})

// async function cacheFirst(request) {
//   const cache = await caches.open(CACHE_NAME)
//   const cachedResponse = await cache.match(request)
//   if (cachedResponse) return cachedResponse
//   const response = await fetch(request)
//   cache.put(request, response.clone())
//   return response
// }

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    return cache.match(request)
  }
}

// fetch event: use network first, then cache
self.addEventListener('fetch', async (event) => {
  event.respondWith(networkFirst(event.request))
})
