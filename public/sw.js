const CACHE = "aviary-v1"

// Static assets with content hashes are safe to cache forever
const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/")

// Never cache these
const isNetworkOnly = (url, method) =>
  method !== "GET" ||
  url.pathname.startsWith("/api/") ||
  url.pathname.startsWith("/auth/")

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)

  // Skip non-http, extensions, or network-only routes
  if (!url.protocol.startsWith("http")) return
  if (isNetworkOnly(url, e.request.method)) return

  if (isStaticAsset(url)) {
    // Cache first — these are immutable content-hashed files
    e.respondWith(
      caches.match(e.request).then(
        (cached) =>
          cached ||
          fetch(e.request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((c) => c.put(e.request, clone))
            }
            return res
          })
      )
    )
    return
  }

  // Network first with cache fallback for pages + images
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(() =>
        caches.match(e.request).then(
          (cached) =>
            cached ||
            (e.request.mode === "navigate"
              ? caches.match("/offline")
              : new Response("Offline", { status: 503 }))
        )
      )
  )
})
