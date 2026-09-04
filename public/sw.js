const CACHE_NAME = "shelf-seasons-shell-v1";
const OFFLINE_ROUTES = ["/ru/offline", "/en/offline", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ROUTES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => {
      const locale = new URL(event.request.url).pathname.startsWith("/en/") ? "en" : "ru";
      return caches.match(`/${locale}/offline`).then(
        (cached) => cached ?? new Response("Shelf Seasons is offline.", { status: 503 }),
      );
    }),
  );
});
