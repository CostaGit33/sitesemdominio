const CACHE_NAME = "futpontos-v39";

// HTML, CSS e JavaScript permanecem sempre em rede para evitar versões antigas.
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
    await Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML, CSS e JS precisam refletir imediatamente as alterações do projeto.
  const liveFile =
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html") ||
    /\.(html|js|css)$/i.test(url.pathname);

  if (liveFile) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        new Response("Sem conexão para carregar esta página.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
      )
    );
    return;
  }

  // Demais recursos usam rede primeiro e cache apenas como fallback.
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
