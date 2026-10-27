/**
 * Minimal in-memory fixed-window counter.
 * Suitable for a single server instance; use a shared store (e.g. Redis)
 * when running multiple instances.
 * @returns {{take: (key: string) => {allowed: boolean, remaining: number, resetInSeconds: number}}}
 */
export const createQuota = ({ windowMs, max }) => {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref?.();

  return {
    take: (key) => {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return {
        allowed: entry.count <= max,
        remaining: Math.max(0, max - entry.count),
        resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
      };
    },
  };
};

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later",
  keyGenerator = (req) => req.ip || req.socket?.remoteAddress || "unknown",
} = {}) => {
  const quota = createQuota({ windowMs, max });

  return (req, res, next) => {
    const key = keyGenerator(req);
    // Nothing to limit on (e.g. missing email); let validation reject it
    if (!key) return next();

    const { allowed, remaining, resetInSeconds } = quota.take(key);

    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(resetInSeconds));

    if (!allowed) {
      res.set("Retry-After", String(resetInSeconds));
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

// Per-account limit on the code step of two-factor sign-in, so a password
// thief can't try codes from many IPs
export const twoFactorRateLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  message: "Too many codes tried for this account, please try again later",
  keyGenerator: (req) => {
    const challenge = req.body?.challenge;
    if (typeof challenge !== "string") return null;
    try {
      const payload = JSON.parse(
        Buffer.from(challenge.split(".")[1], "base64url").toString()
      );
      return typeof payload?.id === "string" ? `2fa:${payload.id}` : null;
    } catch {
      return null;
    }
  },
});

// Coarse limit for the whole API to blunt scraping and floods
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: envInt("API_RATE_LIMIT_MAX", 300),
});

// Per-account caps on writes other people see, so one account (or a stolen
// session) can't flood trips with messages, photos or invitations. Raise
// them all for load tests with USER_RATE_LIMIT_MULTIPLIER.
const multiplier = () => envInt("USER_RATE_LIMIT_MULTIPLIER", 1);
const HOUR = 60 * 60 * 1000;

export const CONTENT_LIMITS = {
  message: { windowMs: 60 * 1000, max: 60, message: "You're sending messages too fast. Wait a moment and try again." },
  photo: { windowMs: HOUR, max: 60, message: "You've uploaded a lot of photos. Please try again later." },
  trip: { windowMs: HOUR, max: 30, message: "You've created a lot of trips. Please try again later." },
  invitation: { windowMs: HOUR, max: 50, message: "You've sent a lot of invitations. Please try again later." },
  joinRequest: { windowMs: HOUR, max: 20, message: "You've sent a lot of join requests. Please try again later." },
  report: { windowMs: HOUR, max: 10, message: "You've sent a lot of reports. Please try again later." },
  review: { windowMs: 15 * 60 * 1000, max: 30, message: "Too many review changes, please try again later" },
};

const quotas = {};
const quotaFor = (kind) => {
  if (!quotas[kind]) {
    const { windowMs, max } = CONTENT_LIMITS[kind];
    quotas[kind] = createQuota({ windowMs, max: max * multiplier() });
  }
  return quotas[kind];
};

/**
 * Take one from a user's quota outside Express (the chat socket)
 * @returns {boolean} whether the action is allowed
 */
export const takeUserQuota = (kind, userId) => quotaFor(kind).take(`${kind}:${userId}`).allowed;

/**
 * Express middleware for a per-user quota; runs after authentication.
 * Anonymous requests (optional auth) are counted per IP.
 */
export const userRateLimiter = (kind) => (req, res, next) => {
  const key = req.user?.id ? `${kind}:${req.user.id}` : `${kind}:ip:${req.ip}`;
  const { allowed, remaining, resetInSeconds } = quotaFor(kind).take(key);
  res.set("RateLimit-Remaining", String(remaining));
  if (!allowed) {
    res.set("Retry-After", String(resetInSeconds));
    return res.status(429).json({ error: "Too many requests", message: CONTENT_LIMITS[kind].message });
  }
  next();
};
