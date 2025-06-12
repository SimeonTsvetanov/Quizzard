// Service Worker for Quizzard PWA
// VERSION: 2025-06-12T15:32:07Z
// Handles caching, updates, and offline functionality
// Version updated: December 7, 2025 - Black bar fix and manifest update

const CACHE_NAME = 'quizzard-complete-icons-2025';
const urlsToCache = [
  '/Quizzard/',
  '/Quizzard/index.html',
  '/Quizzard/manifest.json',
  // New favicon system - all sizes
  '/Quizzard/favicon.ico',
  '/Quizzard/favicon-16x16.png',
  '/Quizzard/favicon-32x32.png',
  '/Quizzard/favicon-48x48.png',
  '/Quizzard/favicon-64x64.png',
  '/Quizzard/favicon-96x96.png',
  '/Quizzard/favicon-128x128.png',
  // Apple Touch Icons - all sizes + fallback
  '/Quizzard/apple-touch-icon.png',
  '/Quizzard/apple-touch-icon-152x152.png',
  '/Quizzard/apple-touch-icon-167x167.png',
  '/Quizzard/apple-touch-icon-180x180.png',
  // Android Chrome Icons - all sizes
  '/Quizzard/android-chrome-192x192.png',
  '/Quizzard/android-chrome-256x256.png',
  '/Quizzard/android-chrome-512x512.png',
  // Standard PWA naming (fallback)
  '/Quizzard/icon-192.png',
  '/Quizzard/icon-512.png',
  // Windows Tiles
  '/Quizzard/mstile-150x150.png',
  // Social Media
  '/Quizzard/og-image.png',
  '/Quizzard/twitter-image.png',
  // Main logo file
  '/Quizzard/quizzard-logo.png',
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
      icon: "/Quizzard/android-chrome-192x192.png",
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
          icon: "/Quizzard/android-chrome-192x192.png",
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
