import "dotenv/config";
import * as Sentry from "@sentry/node";

// Error tracking is optional: without SENTRY_DSN nothing is sent anywhere.
// Load it with `node --import ./src/instrument.js` so Sentry can instrument
// Express, Mongoose and HTTP before they are imported.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    // Never attach cookies, auth headers or IP addresses to events
    sendDefaultPii: false,
  });
}
