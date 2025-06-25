// Service Worker for Quizzard PWA
// VERSION: 2025-06-25T14:36:49Z
// Handles caching, updates, and offline functionality
// Version updated: December 22, 2025 - Development and Production compatibility

// Detect if we're in development or production
const isDevelopment =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const basePath = isDevelopment ? "" : "/Quizzard";

const CACHE_NAME = "quizzard-complete-icons-2025";
const urlsToCache = [
  `${basePath}/`,
  `${basePath}/index.html`,
  `${basePath}/manifest.json`,
  // New favicon system - all sizes
  `${basePath}/favicon.ico`,
  `${basePath}/favicon-16x16.png`,
  `${basePath}/favicon-32x32.png`,
  `${basePath}/favicon-48x48.png`,
  `${basePath}/favicon-64x64.png`,
  `${basePath}/favicon-96x96.png`,
  `${basePath}/favicon-128x128.png`,
  // Apple Touch Icons - all sizes + fallback
  `${basePath}/apple-touch-icon.png`,
  `${basePath}/apple-touch-icon-152x152.png`,
  `${basePath}/apple-touch-icon-167x167.png`,
  `${basePath}/apple-touch-icon-180x180.png`,
  // Android Chrome Icons - all sizes
  `${basePath}/android-chrome-192x192.png`,
  `${basePath}/android-chrome-256x256.png`,
  `${basePath}/android-chrome-512x512.png`,
  // Standard PWA naming (fallback)
  `${basePath}/icon-192.png`,
  `${basePath}/icon-512.png`,
  // Windows Tiles
  `${basePath}/mstile-150x150.png`,
  // Social Media
  `${basePath}/og-image.png`,
  `${basePath}/twitter-image.png`,
  // Main logo file
  `${basePath}/quizzard-logo.png`,
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching essential resources");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Service Worker installed successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker installation failed:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker activated successfully");
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("Service Worker activation failed:", error);
      })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip requests to external domains
  if (!event.request.url.startsWith(location.origin)) {
    return;
  }

  // Skip Vite HMR requests in development
  if (isDevelopment && event.request.url.includes("?t=")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // If not in cache, return a basic offline page
          if (event.request.destination === "document") {
            return caches.match(`${basePath}/index.html`);
          }
          return new Response("Offline", { status: 503 });
        });
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
      icon: `${basePath}/android-chrome-192x192.png`,
      badge: `${basePath}/favicon-96x96.png`,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
      actions: [
        {
          action: "explore",
          title: "Open Quizzard",
          icon: `${basePath}/android-chrome-192x192.png`,
        },
        {
          action: "close",
          title: "Close",
          icon: `${basePath}/favicon-96x96.png`,
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
    event.waitUntil(clients.openWindow(`${basePath}/`));
  }
});
