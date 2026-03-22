// CH Geladas PDV — Service Worker
// BUMP esta versão a cada deploy para forçar atualização do cache nos clientes
const CACHE_NAME = 'ch-geladas-v4'; // FIX-04: bump obrigatório — app-fiado.js adicionado ao cache

const ASSETS_TO_CACHE = [
  '/Dep-sito-CH/',
  '/Dep-sito-CH/index.html',
  '/Dep-sito-CH/manifest.json',
  // Módulos JS — obrigatórios para funcionamento offline
  '/Dep-sito-CH/app-dialogs.js',
  '/Dep-sito-CH/app-core.js',
  '/Dep-sito-CH/app-financeiro.js',
  '/Dep-sito-CH/app-ia.js',
  '/Dep-sito-CH/app-delivery.js',
  '/Dep-sito-CH/app-ponto.js',
  '/Dep-sito-CH/app-comanda.js',
  '/Dep-sito-CH/app-notif.js',
  '/Dep-sito-CH/app-fiado.js',   // FIX-04: estava ausente — fiado não funcionava offline
  '/Dep-sito-CH/firebase.js',
  '/Dep-sito-CH/sync.js',
  // Ícones PWA
  '/Dep-sito-CH/icon-72.png',
  '/Dep-sito-CH/icon-96.png',
  '/Dep-sito-CH/icon-128.png',
  '/Dep-sito-CH/icon-144.png',
  '/Dep-sito-CH/icon-152.png',
  '/Dep-sito-CH/icon-192.png',
  '/Dep-sito-CH/icon-384.png',
  '/Dep-sito-CH/icon-512.png'
];

// Instalação: pré-cacheia os assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve do cache, com fallback para rede (cache-first)
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e externas (Firebase, Telegram, etc.)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cacheia apenas respostas válidas do próprio domínio
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
