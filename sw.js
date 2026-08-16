const CACHE_NAME = "futpontos-v45";

const STATIC_ASSETS = [
  "/futponts_large.png",
  "/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const liveFile = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html") || /\.(html|js|css)$/i.test(url.pathname);
  if (liveFile) {
    event.respondWith(fetch(request, { cache: "no-store" }).catch(() => caches.match(request).then(cached => cached || new Response("Sem conexão para carregar esta página.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })));
    return;
  }
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
