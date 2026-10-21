/**
 * Minimal in-memory fixed-window rate limiter.
 * Suitable for a single server instance; use a shared store (e.g. Redis)
 * when running multiple instances.
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later",
  keyGenerator = (req) => req.ip || req.socket?.remoteAddress || "unknown",
} = {}) => {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref?.();

  return (req, res, next) => {
    const key = keyGenerator(req);
    // Nothing to limit on (e.g. missing email); let validation reject it
    if (!key) return next();

    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.set("RateLimit-Reset", String(Math.ceil((entry.resetAt - now) / 1000)));

    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        error: "Too many requests",
        message,
      });
    }

    next();
  };
};

const envInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX = envInt("AUTH_RATE_LIMIT_MAX", 10);

// Brute-force protection for credential endpoints, per client IP
export const authRateLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  message: "Too many authentication attempts, please try again later",
});

// Per-account limit, so one password can't be guessed from many IPs
export const accountRateLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  message: "Too many attempts for this account, please try again later",
  keyGenerator: (req) =>
    typeof req.body?.email === "string"
      ? `email:${req.body.email.trim().toLowerCase()}`
      : null,
});

// Coarse limit for the whole API to blunt scraping and floods
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: envInt("API_RATE_LIMIT_MAX", 300),
});
