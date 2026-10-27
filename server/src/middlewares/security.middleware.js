import helmet from "helmet";

// Browser error reports go to Sentry's ingest hosts when VITE_SENTRY_DSN is set
const sentryConnectSrc = [
  "https://*.ingest.sentry.io",
  "https://*.ingest.us.sentry.io",
  "https://*.ingest.de.sentry.io",
];

// Plausible (or a self-hosted instance) when the client is built with
// VITE_PLAUSIBLE_DOMAIN; its origin must be allowed to load and receive events
const analyticsOrigin = (() => {
  if (!process.env.ANALYTICS_HOST) return [];
  try {
    const url = new URL(process.env.ANALYTICS_HOST);
    return url.protocol === "https:" ? [url.origin] : [];
  } catch {
    return [];
  }
})();

/**
 * Security headers for every response: Helmet's defaults (HSTS, nosniff,
 * frame-ancestors, referrer policy, ...) plus a CSP tuned for the client.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      // Destination photos, map tiles and UploadThing files come from many hosts
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "script-src": ["'self'", ...analyticsOrigin],
      "connect-src": [
        "'self'",
        ...analyticsOrigin,
        "https://nominatim.openstreetmap.org",
        "https://commons.wikimedia.org",
        ...sentryConnectSrc,
      ],
      "frame-ancestors": ["'none'"],
      "form-action": ["'self'"],
    },
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// The app never needs these browser features
export const permissionsPolicy = (req, res, next) => {
  res.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  next();
};
