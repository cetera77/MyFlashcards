// File: sw.js
const CACHE = 'myflashcards-v1';
const OWN_PREFIXES = ['myflashcards-', 'myanki-'];
const CORE = ['./', './index.html', './manifest.json'];
const OPTIONAL = ['./apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(CORE).then(() =>
        Promise.all(OPTIONAL.map((url) => cache.add(url).catch(() => {})))
      )
    )
  );
  self.skipWaiting();
});

// このアプリ（旧名を含む）の古いキャッシュだけを削除する
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && OWN_PREFIXES.some((p) => k.startsWith(p)))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// オンライン時は最新版を取得してキャッシュを更新し、オフライン時はキャッシュを使う
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || caches.match('./index.html'))
      )
  );
});