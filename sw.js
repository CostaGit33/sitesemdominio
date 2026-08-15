const CACHE_NAME = "futpontos-v33";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/goleiros.html",
  "/desempenho.html",
  "/desempenho-completo.html",
  "/analise-semana.html",
  "/topo.html",
  "/videos.html",
  "/jogador.html",
  "/classificacao.css",
  "/common-nav.css",
  "/responsive-mobile.css",
  "/globais.css",
  "/globais.js",
  "/menu.js",
  "/classificacao.js",
  "/desempenho_data.js",
  "/goleiros.js",
  "/desempenho.js",
  "/desempenho-completo.js",
  "/analise-semana.js",
  "/topo.js",
  "/videos.js",
  "/jogador.js",
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
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const alwaysFresh = request.headers.get("accept")?.includes("text/html") || [
    "/globais.js",
    "/menu.js",
    "/classificacao.js",
    "/goleiros.js",
    "/desempenho.js",
    "/desempenho-completo.js",
    "/analise-semana.js",
    "/topo.js",
    "/videos.js",
    "/jogador.js",
    "/desempenho_data.js",
    "/classificacao.css",
    "/common-nav.css",
    "/responsive-mobile.css",
    "/globais.css",
    "/manifest.json"
  ].includes(url.pathname);

  if (alwaysFresh) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response?.ok) {
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      }
      return response;
    }))
  );
});
