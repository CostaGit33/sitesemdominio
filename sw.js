const CACHE_NAME = "futpontos-v22";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/goleiros.html",
  "/desempenho.html",
  "/analise-semana.html",
  "/topo.html",
  "/videos.html",
  "/jogador.html",

  "/classificacao.css",
  "/common-nav.css",
  "/commom-nav.css",
  "/responsive-mobile.css",
  "/globais.css",

  "/globais.js",
  "/menu.js",
  "/classificacao.js",
  "/desempenho_data.js",
  "/goleiros.js",
  "/desempenho.js",
  "/analise-semana.js",
  "/topo.js",
  "/videos.js",
  "/jogador.js",

  "/futponts_large.png",

  "/manifest.json",
  "/sw.js"
];

// ===============================
// INSTALL
// ===============================
self.addEventListener("install", event => {
  console.log("SW: Instalando nova versão...");

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.error("SW: erro install", err);
      })
  );
});

// ===============================
// ACTIVATE
// ===============================
self.addEventListener("activate", event => {
  console.log("SW: Ativando nova versão...");

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("SW: removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// ===============================
// FETCH
// ===============================
self.addEventListener("fetch", event => {
  const request = event.request;

  // Apenas GET
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // ===============================
  // HTML → NETWORK FIRST
  // evita menu/site antigo
  // ===============================
  if (
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clone);
          });

          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => {
              return cached || caches.match("/index.html");
            });
        })
    );

    return;
  }

  // ===============================
  // APIs → NETWORK FIRST
  // ===============================
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/jogadores") ||
    url.pathname.startsWith("/goleiros") ||
    url.pathname.startsWith("/desempenho")
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clone);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            return (
              cached ||
              new Response(JSON.stringify([]), {
                status: 200,
                headers: {
                  "Content-Type": "application/json"
                }
              })
            );
          });
        })
    );

    return;
  }

  // ===============================
  // CSS / JS / IMG
  // CACHE FIRST + UPDATE BACKGROUND
  // ===============================
  event.respondWith(
    caches.match(request).then(cached => {

      const networkFetch = fetch(request)
        .then(response => {

          if (
            response &&
            response.status === 200
          ) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clone);
            });
          }

          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
