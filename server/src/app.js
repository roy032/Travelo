import express from "express";
import * as Sentry from "@sentry/node";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import authRoutes from "#routes/auth.route.js";
import documentRoutes from "#routes/document.route.js";
import adminRoutes from "#routes/admin.route.js";
import tripRoutes from "#routes/trip.route.js";
import reportRoutes from "#routes/report.route.js";
import messageRoutes from "#routes/message.route.js";
import activityRoutes from "#routes/activity.route.js";
import checklistRoutes from "#routes/checklist.route.js";
import noteRoutes from "#routes/note.route.js";
import expenseRoutes from "#routes/expense.route.js";
import photoRoutes from "#routes/photo.route.js";
import destinationRoutes from "#routes/destination.route.js";
import packingRoutes from "#routes/packing.route.js";
import profileRoutes from "#routes/profile.route.js";
import notificationRoutes from "#routes/notification.route.js";
import invitationRoutes from "#routes/invitation.route.js";
import healthRoutes from "#routes/health.route.js";
import {
  securityHeaders,
  permissionsPolicy,
} from "#middlewares/security.middleware.js";
import { apiRateLimiter } from "#middlewares/rateLimit.middleware.js";
import { tripLiveUpdates } from "#src/socket/tripLive.js";
import aiPlannerRoutes from "#routes/aiPlanner.route.js";
import favoriteRoutes from "#routes/favorite.route.js";
import shareRoutes from "#routes/share.route.js";
import seoRoutes from "#routes/seo.route.js";
import {
  getSiteUrl,
  renderIndexHtml,
  sharedTripPage,
} from "#utils/seo.js";
import { getSharedTrip } from "#services/share.service.js";
import {
  errorHandler,
  notFoundHandler,
} from "#middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Comma-separated list of allowed browser origins
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Needed for correct req.ip (rate limiting) behind a reverse proxy
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(securityHeaders);
app.use(permissionsPolicy);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// In production the built client is served from the same origin as the API,
// so the strict SameSite auth cookie is sent with every request.
const clientDist = process.env.CLIENT_DIST
  ? path.resolve(process.env.CLIENT_DIST) // sendFile needs an absolute path
  : undefined;
const serveClient = Boolean(
  clientDist && existsSync(path.join(clientDist, "index.html")),
);
if (serveClient) {
  app.use(
    express.static(clientDist, {
      // index.html is rendered per page by the fallback route below
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          // Vite build output has content hashes in its file names
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (path.basename(filePath) === "sw.js") {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );
}

// Serve legacy locally stored files. Identity documents are never served publicly.
app.use("/uploads/documents", (req, res) => {
  res.status(404).json({ error: "Resource not found" });
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check routes ("/" is the landing page when the client is served)
if (!serveClient) {
  app.get("/", (req, res) => {
    res.status(200).send("Hello from travelo!");
  });
}

app.get("/api", (req, res) => {
  res.status(200).json({ message: "travelo API is running!" });
});

// Uptime monitors poll this; it is mounted before the API rate limiter
app.use("/api/health", healthRoutes);

app.use("/api", apiRateLimiter);

// Tells other members viewing a trip when one of its sections changes
app.use("/api", tripLiveUpdates);

app.use(seoRoutes);

// API routes
app.use("/api/auth", authRoutes);
// Public routes must be mounted before routers that are mounted at "/api" and
// apply authenticateToken to every request passing through them
app.use("/api/destinations", destinationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/shared", shareRoutes); // Public shared-trip links
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trips", tripRoutes); // Must be first to catch /explore before authenticated routes
app.use("/api/trips", reportRoutes); // Must be before other trip routes to match /trips/:tripId/report
app.use("/api/trips", messageRoutes); // Chat endpoints
app.use("/api", aiPlannerRoutes);
app.use("/api", activityRoutes);
app.use("/api", checklistRoutes);
app.use("/api", noteRoutes);
app.use("/api", expenseRoutes);
app.use("/api", photoRoutes);
app.use("/api", packingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", notificationRoutes);
app.use("/api", invitationRoutes);

// Client-side routes fall back to index.html
if (serveClient) {
  const indexTemplate = readFileSync(
    path.join(clientDist, "index.html"),
    "utf8",
  );
  app.get(
    /^\/(?!api\/|api$|socket\.io\/|uploads\/|assets\/).*/,
    async (req, res, next) => {
      try {
        // Shared trips get their own title and description in link previews
        const shareMatch = req.path.match(/^\/share\/([^/]+)\/?$/);
        const page = shareMatch
          ? sharedTripPage(await getSharedTrip(shareMatch[1]))
          : undefined;
        res
          .type("html")
          .set("Cache-Control", "no-cache")
          .send(renderIndexHtml(indexTemplate, req.path, getSiteUrl(req), page));
      } catch (e) {
        next(e);
      }
    },
  );
}

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Reports unexpected (5xx) errors to Sentry; a no-op when SENTRY_DSN is unset
Sentry.setupExpressErrorHandler(app);

// Error handler - must be last
app.use(errorHandler);

export default app;
