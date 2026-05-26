const CACHE_NAME = "futpontos-v13";

// Arquivos que ficam disponíveis offline
const STATIC_ASSETS = [
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

// INSTALL: faz cache dos assets estáticos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Service Worker: Cacheando arquivos estáticos...");
      return cache.addAll(STATIC_ASSETS);
    }).catch(error => {
      console.warn("Service Worker: Erro ao cachear assets", error);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: limpa caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("Service Worker: Deletando cache antigo:", key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// FETCH: estratégia por tipo de recurso
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Ignorar requisições não-GET
  if (event.request.method !== "GET") {
    return;
  }

  // Chamadas de API: network first, sem fallback de cache
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/jogadores") ||
    pathname.startsWith("/goleiros") ||
    pathname.startsWith("/desempenho") ||
    url.hostname !== self.location.hostname
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache bem-sucedido para próximas requisições
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // API offline: tenta cache, se não houver retorna JSON vazio
          return caches.match(event.request).then(cached => {
            return cached || new Response(JSON.stringify([]), {
              status: 200,
              statusText: "OK",
              headers: { "Content-Type": "application/json" }
            });
          });
        })
    );
    return;
  }

  // Assets estáticos: cache first, fallback network
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(event.request).then(response => {
          // Validar resposta
          if (!response || response.status !== 200 || response.type === "error") {
            return response;
          }

          // Atualizar cache com a versão mais recente
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });

          return response;
        });
      })
      .catch(() => {
        // Fallback para página offline se configurada
        return caches.match("/index.html");
      })
  );
});








