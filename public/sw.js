/* Simple service worker for offline caching */
const CACHE_VERSION = 'v1';
const CORE_CACHE = `core-${CACHE_VERSION}`;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CORE_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('core-') && k !== CORE_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // navigation requests: network first, fallback to offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('/offline.html'))
    );
    return;
  }
  // runtime cache-first for same-origin static assets
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok && new URL(req.url).origin === location.origin) {
          const clone = res.clone();
            caches.open(CORE_CACHE).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => undefined);
    })
  );
});
