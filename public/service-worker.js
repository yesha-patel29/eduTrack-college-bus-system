const CACHE_NAME = 'bus-tracker-v2';

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only cache static GET requests, bypass for socket.io or non-HTTP
    if (event.request.method !== 'GET' || event.request.url.includes('/socket.io/')) {
        return;
    }
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
