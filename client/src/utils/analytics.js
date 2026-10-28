// Privacy-friendly product analytics with Plausible: no cookies and no
// personal data, so no consent banner is needed. Off unless the client is
// built with VITE_PLAUSIBLE_DOMAIN (and the server has ANALYTICS_HOST set to
// the same host so its CSP allows the script).
const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const host = (import.meta.env.VITE_PLAUSIBLE_HOST || "https://plausible.io").replace(/\/+$/, "");

export const analyticsEnabled = () => Boolean(domain);

/** Add the Plausible script once; it tracks page views, including SPA navigation */
export const initAnalytics = () => {
  if (!domain || typeof document === "undefined") return;
  if (document.querySelector("script[data-travelo-analytics]")) return;
  // Queue events sent before the script loads
  window.plausible =
    window.plausible ||
    function queue(...args) {
      (window.plausible.q = window.plausible.q || []).push(args);
    };
  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = domain;
  script.dataset.traveloAnalytics = "";
  script.src = `${host}/js/script.js`;
  document.head.appendChild(script);
};

/**
 * Count a product event, such as "Signup" or "Trip created", for funnels.
 * Never pass names, emails or other personal data in props.
 * @param {string} name
 * @param {Record<string, string|number|boolean>} [props]
 */
export const trackEvent = (name, props) => {
  if (!domain || typeof window === "undefined" || !window.plausible) return;
  window.plausible(name, props ? { props } : undefined);
};
