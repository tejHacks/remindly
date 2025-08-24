// Cache name
const CACHE_NAME = 'remindly-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js', // Adjust based on your build output
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event: Cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Push event: Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag,
    requireInteraction: true
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});