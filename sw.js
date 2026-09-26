const CACHE_NAME = "job-time-income-cache-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          // cache the response for future
          if (!resp || resp.status !== 200 || resp.type !== "basic")
            return resp;
          const clone = resp.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});
