// Minimal app-shell cache — just enough for PWA installability and faster
// repeat loads of static assets. Deliberately not caching API responses or
// article content: news goes stale fast, so an offline-first cache for it
// would serve outdated data instead of "no connection," which is worse.
//
// "/" must NOT be in this list even though it looks like a static shell
// asset — it's a server-rendered HTML document whose header UI depends on
// the visitor's session (logged-in vs logged-out). Caching it cache-first
// used to mean a fresh tab could get served yesterday's HTML with a stale
// or missing session baked in, showing "Log in" even while signed in. Only
// truly static, session-independent files belong here.
const CACHE_NAME = "morningfeeds-shell-v2";
const SHELL_ASSETS = ["/manifest.json", "/images/icon-192.png", "/images/icon-512.png"];

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

// Push payloads are sent as plain JSON from lib/webPush.js — { title, body,
// url }. `url` is where notificationclick below sends the user; defaults to
// the Following page since that's what this app's only push trigger
// (followed-keyword matches) is about.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const { title, body, url } = payload;
  event.waitUntil(
    self.registration.showNotification(title || "MorningFeeds", {
      body,
      icon: "/images/icon-192.png",
      badge: "/images/icon-192.png",
      data: { url: url || "/following" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/following";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
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
