const CACHE_NAME = "aetheris-health-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/logo.svg", "/logo-light.svg"];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for pages, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API calls entirely — never cache API responses
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  // Skip Clerk auth requests
  if (url.hostname.includes("clerk")) return;

  // Skip authenticated dashboard pages — caching them causes stale user data
  if (
    url.pathname.startsWith("/patient/") ||
    url.pathname.startsWith("/doctor/") ||
    url.pathname.startsWith("/pharmacy/") ||
    url.pathname.startsWith("/admin/")
  ) {
    return;
  }

  // Cache-first for static assets (images, fonts, css, js)
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Only cache successful responses
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first for public pages (fall back to cache when offline)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses — don't cache 404/500 pages
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
