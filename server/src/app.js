import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { existsSync } from "fs";
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
import favoriteRoutes from "#routes/favorite.route.js";
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

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Destination photos, map tiles and UploadThing files come from many hosts
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": [
          "'self'",
          "https://api.open-meteo.com",
          "https://nominatim.openstreetmap.org",
          "https://commons.wikimedia.org",
        ],
      },
    },
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// In production the built client is served from the same origin as the API,
// so the strict SameSite auth cookie is sent with every request.
const clientDist = process.env.CLIENT_DIST;
const serveClient = Boolean(
  clientDist && existsSync(path.join(clientDist, "index.html"))
);
if (serveClient) {
  app.use(express.static(clientDist));
}

// Serve legacy locally stored files. Identity documents are never served publicly.
app.use("/uploads/documents", (req, res) => {
  res.status(404).json({ error: "Resource not found" });
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check routes
app.get("/", (req, res) => {
  res.status(200).send("Hello from travelo!");
});

app.get("/api", (req, res) => {
  res.status(200).json({ message: "travelo API is running!" });
});

// API routes
app.use("/api/auth", authRoutes);
// Public routes must be mounted before routers that are mounted at "/api" and
// apply authenticateToken to every request passing through them
app.use("/api/destinations", destinationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trips", tripRoutes); // Must be first to catch /explore before authenticated routes
app.use("/api/trips", reportRoutes); // Must be before other trip routes to match /trips/:tripId/report
app.use("/api/trips", messageRoutes); // Chat endpoints
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
  app.get(/^\/(?!api\/|api$|socket\.io\/|uploads\/|assets\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

export default app;
