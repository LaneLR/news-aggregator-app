// Minimal app-shell cache — just enough for PWA installability and faster
// repeat loads of static assets. Deliberately not caching API responses or
// article content: news goes stale fast, so an offline-first cache for it
// would serve outdated data instead of "no connection," which is worse.
const CACHE_NAME = "morningfeeds-shell-v1";
const SHELL_ASSETS = ["/", "/manifest.json", "/images/icon-192.png", "/images/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only cache-first our own static assets — everything else (API calls,
  // article images via the proxy, HTML documents) always goes to the
  // network so content stays fresh.
  const url = new URL(request.url);
  const isStaticAsset =
    request.method === "GET" &&
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || SHELL_ASSETS.includes(url.pathname));

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
