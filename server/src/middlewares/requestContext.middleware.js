import { randomUUID } from "crypto";
import * as Sentry from "@sentry/node";
import { logger } from "#utils/logger.js";

// Accept an ID from a proxy or load balancer only if it looks like one
const VALID_ID = /^[A-Za-z0-9._-]{8,64}$/;

/**
 * Give every request an ID, return it in X-Request-Id, tag Sentry events
 * with it and write one access log line when the response is sent. Users
 * can quote the ID from an error message, and support can find the request.
 */
export const requestContext = (req, res, next) => {
  const incoming = req.get("x-request-id");
  req.id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader("X-Request-Id", req.id);
  Sentry.getIsolationScope().setTag("request_id", req.id);

  const started = process.hrtime.bigint();
  res.on("finish", () => {
    // Uptime pings would drown everything else
    const path = req.originalUrl.split("?")[0];
    if (path === "/api/health") return;
    const status = res.statusCode;
    const fields = {
      requestId: req.id,
      method: req.method,
      // No query string: it can carry tokens (reset links, share tokens)
      path,
      status,
      durationMs: Number((process.hrtime.bigint() - started) / 1000n) / 1000,
      userId: req.user?.id,
    };
    if (status >= 500) logger.error("request", fields);
    else if (status >= 400) logger.warn("request", fields);
    else logger.info("request", fields);
  });

  next();
};
