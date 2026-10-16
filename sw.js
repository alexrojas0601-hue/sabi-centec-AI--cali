// AI CENTEC · service worker: app instalable y apertura rápida.
// La página siempre se pide primero a la red (para tener la versión más nueva); si no hay internet,
// se muestra la última copia guardada. Las respuestas de la IA y los datos en vivo nunca se guardan.
const CACHE = 'ai-centec-v4.1';
const BASE = ['/', '/sabi-dots.js', '/sabi-recursos.js', '/manifest.webmanifest', '/assets/icon-192.png', '/assets/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const portada = u.pathname === '/' || u.pathname === '/index.html';
      if (r.ok && (portada || BASE.includes(u.pathname))) {
        const copia = r.clone(); caches.open(CACHE).then((c) => c.put(portada ? '/' : e.request, copia));
      }
      return r;
    }).catch(() => caches.match(u.pathname === '/index.html' ? '/' : e.request, { ignoreSearch: e.request.mode === 'navigate' }))
  );
});
