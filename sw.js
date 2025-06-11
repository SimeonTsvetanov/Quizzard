// Service Worker for Quizzard PWA
// VERSION: 2025-06-11T20:46:36Z
// Handles caching, updates, and offline functionality
// Version updated: December 11, 2025 - Points Counter bug fixes + Vite asset caching

const CACHE_NAME = "quizzard-points-counter-fix-2025";
const urlsToCache = [
  "/Quizzard/",
  "/Quizzard/index.html",
  "/Quizzard/manifest.json",
  // New favicon system - all sizes
  "/Quizzard/favicon.ico",
  "/Quizzard/favicon-16x16.png",
  "/Quizzard/favicon-32x32.png",
  "/Quizzard/favicon-48x48.png",
  "/Quizzard/favicon-64x64.png",
  "/Quizzard/favicon-96x96.png",
  "/Quizzard/favicon-128x128.png",
  // Apple Touch Icons - all sizes + fallback
  "/Quizzard/apple-touch-icon.png",
  "/Quizzard/apple-touch-icon-152x152.png",
  "/Quizzard/apple-touch-icon-167x167.png",
  "/Quizzard/apple-touch-icon-180x180.png",
  // Android Chrome Icons - all sizes
  "/Quizzard/android-chrome-192x192.png",
  "/Quizzard/android-chrome-256x256.png",
  "/Quizzard/android-chrome-512x512.png",
  // Standard PWA naming (fallback)
  "/Quizzard/icon-192.png",
  "/Quizzard/icon-512.png",
  // Windows Tiles
  "/Quizzard/mstile-150x150.png",
  // Social Media
  "/Quizzard/og-image.png",
  "/Quizzard/twitter-image.png",
  // Main logo file
  "/Quizzard/quizzard-logo.png",
];

// Install event - aggressive cache clearing + Points Counter fix deployment
self.addEventListener("install", (event) => {
  console.log("Installing Points Counter bug fix service worker...");

  event.waitUntil(
    // First clear ALL existing caches to ensure fresh JavaScript files
    caches
      .keys()
      .then((cacheNames) => {
        console.log(
          "Clearing all caches for Points Counter bug fixes:",
          cacheNames
        );
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        // Then create fresh cache
        console.log("Creating new cache:", CACHE_NAME);
        return caches.open(CACHE_NAME);
      })
      .then((cache) => {
        // Cache static assets first
        console.log("Caching static assets...");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force immediate activation to serve new JavaScript files
        console.log(
          "Points Counter service worker installed, forcing activation..."
        );
        return self.skipWaiting();
      })
  );
});

// Activate event - remove old caches and take control for Points Counter fixes
self.addEventListener("activate", (event) => {
  console.log("Activating Points Counter bug fix service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        console.log("Final cleanup of old caches:", cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache during activate:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately to serve new JavaScript
        console.log(
          "Taking control of all clients for Points Counter fixes..."
        );
        return self.clients.claim();
      })
      .then(() => {
        console.log("Points Counter service worker fully activated!");
      })
  );
});

// Fetch event - network first with intelligent caching for Vite assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle requests to our app (same origin)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network request succeeds, cache it
        if (response.status === 200) {
          const responseClone = response.clone();

          // Always cache these file types (including Vite build outputs)
          const shouldCache =
            url.pathname.includes("/Quizzard/") &&
            (url.pathname.endsWith(".html") ||
              url.pathname.endsWith(".js") ||
              url.pathname.endsWith(".css") ||
              url.pathname.endsWith(".json") ||
              url.pathname.endsWith(".png") ||
              url.pathname.endsWith(".jpg") ||
              url.pathname.endsWith(".ico") ||
              url.pathname.includes("/assets/") || // Vite assets folder
              url.pathname === "/Quizzard/"); // Root path

          if (shouldCache) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
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
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
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
