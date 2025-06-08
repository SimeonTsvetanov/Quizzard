// Service Worker for Quizzard PWA
// VERSION: 2025-06-08T18:57:34Z
// Handles caching, updates, and offline functionality
// Version updated: June 6, 2025 - SPA routing fix

const CACHE_NAME = "quizzard-v1.0.1";
const STATIC_CACHE_NAME = "quizzard-static-v1.0.1";

// Files to cache for offline functionality
const urlsToCache = [
  "/Quizzard/",
  "/Quizzard/index.html",
  "/Quizzard/manifest.json",
  "/Quizzard/favicon.svg",
  "/Quizzard/favicon-96x96.png",
  "/Quizzard/icon-192.png",
  "/Quizzard/icon-512.png",
  "/Quizzard/apple-touch-icon.png",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );

  // Notify clients that a new version is available
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "SW_UPDATED",
        message: "App updated! Refresh to see changes.",
      });
    });
  });
});

// Fetch event - serve from cache, fallback to network and handle SPA routes
self.addEventListener("fetch", (event) => {
  // Extract the URL for easier handling
  const url = new URL(event.request.url);

  // Handle navigation requests for SPA routes (HTML requests)
  // If it's a navigation request and it's on our domain and it's not a direct file fetch
  const isNavigationRequest = event.request.mode === "navigate";
  const isHtmlRequest = event.request.headers
    .get("Accept")
    ?.includes("text/html");
  const isOurDomain = url.origin === self.location.origin;
  const isQuizzardPath = url.pathname.startsWith("/Quizzard/");
  const isDirectFileRequest = url.pathname.match(
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|json)$/i
  );

  if (
    isNavigationRequest &&
    isHtmlRequest &&
    isOurDomain &&
    isQuizzardPath &&
    !isDirectFileRequest
  ) {
    // For SPA navigation requests, serve the index.html
    event.respondWith(
      caches.match("/Quizzard/index.html").then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch("/Quizzard/index.html");
      })
    );
    return;
  }

  // For all other requests, use normal caching strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
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
      icon: "/Quizzard/icon-192.png",
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
          icon: "/Quizzard/icon-192.png",
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
