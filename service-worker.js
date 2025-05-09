const CACHE_NAME = 'protein-meter-cache-v3';

const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/html5-qrcode',
  './app-icon.svg',
  './apple-touch-icon.png',
  './manifest.json'
];

// --- Installation Event ---
// This event fires when the service worker is first installed.
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // Perform install steps: Open cache and add files to it
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Add all URLs specified in urlsToCache to the cache
        // Use addAll for atomic operation (fails if any fetch fails)
        return cache.addAll(urlsToCache).catch(error => {
          // Log caching errors for debugging
          console.error('Service Worker: Failed to cache files during install:', error);
          // Optional: Rethrow error to fail installation if core assets fail
          // throw error;
        });
      })
      .then(() => {
        console.log('Service Worker: Installation complete, app shell cached.');
        // Force the waiting service worker to become the active service worker.
        // This ensures the latest cache is used immediately on first load after install.
        return self.skipWaiting();
      })
  );
});

// --- Activation Event ---
// This event fires when the service worker becomes active.
// It's a good place to clean up old caches.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If the cache name isn't in our whitelist, delete it
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete, old caches cleaned.');
      // Tell the active service worker to take control of the page immediately.
      return self.clients.claim();
    })
  );
});

// --- Fetch Event ---
// This event fires every time the app requests a resource (HTML, CSS, JS, images, API calls).
self.addEventListener('fetch', event => {
  // console.log('Service Worker: Fetching ', event.request.url);

  // Use a Cache-First strategy for requests.
  event.respondWith(
    caches.match(event.request) // Check if the request exists in the cache
      .then(response => {
        // Cache hit - return the cached response
        if (response) {
          // console.log('Service Worker: Found in cache', event.request.url);
          return response;
        }

        // Not in cache - fetch from the network
        // console.log('Service Worker: Not found in cache, fetching from network', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Optional: Cache the fetched response for future offline use.
            // Be careful caching external resources or API calls unless intended.
            // We are already caching core assets during install.
            // If you want to cache dynamically fetched resources (like images), clone the response.
            // let responseToCache = networkResponse.clone();
            // caches.open(CACHE_NAME)
            //   .then(cache => {
            //     cache.put(event.request, responseToCache);
            //   });

            // Return the network response to the page
            return networkResponse;
          }
        ).catch(error => {
          // Handle fetch errors (e.g., network offline)
          console.error('Service Worker: Fetch failed; returning offline page instead.', error);
          // Optional: Return a custom offline fallback page/message
          // For a single-page app, returning the cached index might be okay,
          // but ensure API calls handle offline states gracefully in the main app JS.
          // return caches.match('./offline.html'); // Example fallback page
        });
      })
  );
});
