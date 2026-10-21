// Error tracking is optional: Sentry is only downloaded when
// VITE_SENTRY_DSN is set at build time, so it costs nothing otherwise.
const dsn = import.meta.env.VITE_SENTRY_DSN;

let sentryPromise = null;

export function initMonitoring() {
  if (!dsn || sentryPromise) return;

  sentryPromise = import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      // Never attach cookies, IP addresses or request bodies
      sendDefaultPii: false,
    });
    return Sentry;
  });
}

export function reportError(error, errorInfo) {
  if (!sentryPromise) return;

  sentryPromise.then((Sentry) => {
    Sentry.captureException(error, {
      contexts: errorInfo?.componentStack
        ? { react: { componentStack: errorInfo.componentStack } }
        : undefined,
    });
  });
}
