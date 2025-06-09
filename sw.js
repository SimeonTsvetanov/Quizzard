// Service Worker for Quizzard PWA
// VERSION: 2025-06-09T12:55:38Z
// Handles caching, updates, and offline functionality
// Version updated: December 7, 2025 - Black bar fix and manifest update

const CACHE_NAME = 'quizzard-mint-icons-2025';
const urlsToCache = [
  '/Quizzard/',
  '/Quizzard/index.html',
  '/Quizzard/manifest.json?v=mint',
  '/Quizzard/icon-192.png?v=mint',
  '/Quizzard/icon-512.png?v=mint', 
  '/Quizzard/apple-touch-icon.png?v=mint',
  '/Quizzard/quizzard-logo.png',
  '/Quizzard/favicon.ico',
];

// Install event - aggressive cache clearing for theme fix
self.addEventListener('install', (event) => {
  event.waitUntil(
    // First clear ALL existing caches to fix theme colors
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting old cache for theme fix:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Then create fresh cache with updated manifest
      return caches.open(CACHE_NAME);
    }).then((cache) => {
      return cache.addAll(urlsToCache);
    }).then(() => {
      // Force immediate activation
      return self.skipWaiting();
    })
  );
});

// Activate event - remove old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache during activate:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - always try network first to avoid cache issues
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network request succeeds, cache it
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Message event - handle update requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Background sync triggered");
    // Handle any background synchronization tasks here
  }
});

// Push notification handler (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/Quizzard/icon-192.png?v=mint",
      badge: "/Quizzard/favicon-96x96.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
      actions: [
        {
          action: "explore",
          title: "Open Quizzard",
          icon: "/Quizzard/icon-192.png?v=mint",
        },
        {
          action: "close",
          title: "Close",
          icon: "/Quizzard/favicon-96x96.png",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/Quizzard/"));
  }
});
