// UIT HUB Service Worker - Offline Cache & Fast Launch
const CACHE_NAME = "uit-hub-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/feed.html",
  "/reviews.html",
  "/style.css",
  "/manifest.json",
  "/assets/favicon-32.png",
  "/assets/favicon-192.png",
  "/assets/favicon-512.png",
  "/assets/logo-icon.png",
  "/libs/fontawesome/all.min.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws")) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
