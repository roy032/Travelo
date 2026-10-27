// Structured logs: one JSON object per line in production, so the host's log
// search (Render, Fly, Datadog, Loki...) can filter on fields such as
// requestId, status or userId. Readable lines in development.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const threshold = () =>
  LEVELS[process.env.LOG_LEVEL] ??
  (process.env.NODE_ENV === "test" ? LEVELS.warn : LEVELS.info);

const asJson = () =>
  process.env.LOG_FORMAT
    ? process.env.LOG_FORMAT === "json"
    : process.env.NODE_ENV === "production";

const write = (level, msg, fields = {}) => {
  if (LEVELS[level] < threshold()) return;
  const stream = level === "error" || level === "warn" ? console.error : console.log;
  if (asJson()) {
    stream(JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields }));
  } else {
    const extra = Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : "";
    stream(`[${level}] ${msg}${extra}`);
  }
};

export const logger = {
  debug: (msg, fields) => write("debug", msg, fields),
  info: (msg, fields) => write("info", msg, fields),
  warn: (msg, fields) => write("warn", msg, fields),
  error: (msg, fields) => write("error", msg, fields),
};
