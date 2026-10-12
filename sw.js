// Task Kosin service worker — caches the app shell so it opens instantly and offline.
// Task data always comes from the Google Sheet API (never cached here).
const VERSION = 'task-kosin-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/task-kosin-32.png',
  './icons/task-kosin-180.png',
  './icons/task-kosin-192.png',
  './icons/task-kosin-512.png',
  './icons/task-kosin-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // API + fonts go straight to network

  // Page: network first so updates show up, cache as fallback when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Icons and manifest: cache first
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
