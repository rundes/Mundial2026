// Service Worker para Mi Álbum Mundial 2026
// Estrategia: cache-first para los recursos estáticos (que en este caso son
// básicamente solo index.html, porque la app es un único archivo).
//
// Bumpear CACHE_VERSION cuando se publica una versión nueva para que los
// usuarios reciban la actualización en su próximo refresh.

const CACHE_VERSION = 'album-2026-v1';
const URLS_A_CACHEAR = [
  './',
  './index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(URLS_A_CACHEAR))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo GET; ignoramos POST, etc.
  if (req.method !== 'GET') return;

  // Para la navegación al HTML usamos network-first con fallback al cache
  // así, si publicamos una versión nueva, los usuarios la reciben al toque
  // cuando están online; y si están sin internet, igual abren la última.
  const esNavegacion = req.mode === 'navigate' ||
    (req.destination === 'document') ||
    (req.headers.get('accept') || '').includes('text/html');

  if (esNavegacion) {
    event.respondWith(
      fetch(req).then((res) => {
        const copia = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Para todo lo demás: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // Cacheo respuestas opacas y same-origin satisfactorias
      if (res && (res.status === 200 || res.type === 'opaque')) {
        const copia = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia)).catch(() => {});
      }
      return res;
    }).catch(() => cached))
  );
});
