// Must match API_CACHE in public/sw.js
export const API_CACHE = "travelo-api";
export const SW_UPDATED_EVENT = "travelo:sw-updated";

/**
 * Delete the trips, profile and photos the service worker saved for offline
 * use. Called on sign-in and sign-out so one account's data never shows up
 * for another on a shared device.
 */
export const clearOfflineData = async () => {
  try {
    if (typeof caches !== "undefined") await caches.delete(API_CACHE);
  } catch {
    // Cache storage unavailable (private mode, old browser): nothing saved
  }
};

/**
 * Register the service worker. When a new version takes over an open page,
 * fire SW_UPDATED_EVENT so the page can offer a reload.
 */
export const registerServiceWorker = (url = "/sw.js") => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  // A first install also fires controllerchange; only later ones are updates
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) window.dispatchEvent(new Event(SW_UPDATED_EVENT));
  });
  return navigator.serviceWorker.register(url).catch((error) => {
    console.error("Service worker registration failed:", error);
    return null;
  });
};
