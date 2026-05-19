// Service Worker para Mi Álbum Mundial 2026
//
// Estrategia:
// - 'install': precachear los assets críticos. NO hacemos skipWaiting() acá;
//   esperamos a que la página nos envíe el mensaje SKIP_WAITING (cuando el
//   usuario tocó "Actualizar" en el banner) para no romper su sesión sin aviso.
// - 'activate': borramos caches viejos.
// - 'fetch': network-first para la navegación (HTML) con fallback al cache,
//   cache-first para el resto.
//
// IMPORTANTE: bumpear CACHE_VERSION cada vez que se publica una versión nueva.
// El service worker se vuelve a descargar cuando cambia este archivo, y al
// hacerlo nuestro listener 'updatefound' en el HTML va a disparar y mostrarle
// al usuario el banner "Hay una versión nueva".

const CACHE_VERSION = 'album-2026-v1.9.16';
const URLS_A_CACHEAR = [
  './',
  './index.html',
  './manifest.webmanifest?v=1.9.16',
  './icons/icon-100.png?v=1.9.16',
  './icons/icon-180.png?v=1.9.16',
  './icons/icon-192.png?v=1.9.16',
  './icons/icon-512.png?v=1.9.16',
  './icons/icon-192-maskable.png?v=1.9.16',
  './icons/icon-512-maskable.png?v=1.9.16',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(URLS_A_CACHEAR.map((url) =>
        cache.add(url).catch(() => null)
      ))
    )
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

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const esNavegacion = req.mode === 'navigate' ||
    (req.destination === 'document') ||
    (req.headers.get('accept') || '').includes('text/html');

  if (esNavegacion) {
    // Network-first para la navegación: si publicamos una versión nueva,
    // los usuarios la reciben enseguida cuando están online.
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copia = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return res;
      }).catch(() =>
        caches.match(req).then((r) => r || caches.match('./index.html'))
      )
    );
    return;
  }

  // Para los íconos, network-first también: así si cambian, los recibís
  // al toque y no se quedan pegados los viejos al actualizar la app.
  if (url.pathname.includes('/icons/') || url.pathname.endsWith('manifest.webmanifest')) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copia = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first para el resto
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copia = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});
