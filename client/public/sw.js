// Travelo service worker: makes the app installable and keeps it usable
// offline. The app shell and build files are saved at install; trips,
// profile and photos are saved as they are viewed, so a trip opened once
// still opens without signal.
//
// `vite build` replaces BUILD_ID and BUILD_ASSETS (see vite.config.js), so
// every deploy ships a changed worker and the browser picks it up.
const BUILD_ID = "dev";
const BUILD_ASSETS = [];

const SHELL_CACHE = `travelo-shell-${BUILD_ID}`;
const STATIC_CACHE = `travelo-static-${BUILD_ID}`;
// Not versioned: saved trips survive deploys. Cleared by the page on sign-in
// and sign-out (src/utils/offline.js uses the same name)
const API_CACHE = "travelo-api";
const SHELL_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .open(SHELL_CACHE)
        .then((cache) =>
          cache.addAll([SHELL_URL, "/manifest.webmanifest", "/favicon.svg"])
        ),
      // One missing file must not stop the worker installing
      caches
        .open(STATIC_CACHE)
        .then((cache) =>
          Promise.all(BUILD_ASSETS.map((url) => cache.add(url).catch(() => {})))
        ),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !keep.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/assets/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/main/") ||
  url.pathname === "/favicon.svg" ||
  url.pathname === "/theme-init.js";

// API reads worth having offline. Sign-in, health checks, identity
// documents (NID, passport scans) and account data exports are never stored.
const isCacheableApi = (url) =>
  url.pathname.startsWith("/api/") &&
  !url.pathname.startsWith("/api/auth/") &&
  !url.pathname.startsWith("/api/health") &&
  !url.pathname.startsWith("/api/documents") &&
  url.pathname !== "/api/profile/export";

// Network first so online users always see fresh data; the saved copy is
// only used when the request fails
const networkFirst = (request, cacheName) =>
  fetch(request)
    .then((response) => {
      if (response.status === 200) {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() =>
      caches
        .open(cacheName)
        .then((cache) => cache.match(request))
        .then((cached) => cached || Response.error())
    );

// Files whose URL changes when their content does: serve the saved copy
const cacheFirst = (request, cacheName) =>
  caches.open(cacheName).then((cache) =>
    cache.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.status === 200) cache.put(request, response.clone());
          return response;
        })
    )
  );

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/socket.io")) return;

  if (isCacheableApi(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Trip photos and receipts stored by the server (named by upload id)
  if (url.pathname.startsWith("/uploads/")) {
    event.respondWith(cacheFirst(request, API_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api")) return;

  // Pages: try the network so deploys show up at once, fall back to the
  // saved shell when offline (the router then draws the right page)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.pathname === SHELL_URL) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(SHELL_URL, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(SHELL_URL)
            .then((cached) => cached || Response.error())
        )
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches
        .match(request)
        .then((cached) => cached || cacheFirst(request, STATIC_CACHE))
    );
  }
});
