import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "#routes/auth.route.js";
import documentRoutes from "#routes/document.route.js";
import adminRoutes from "#routes/admin.route.js";
import tripRoutes from "#routes/trip.route.js";
import activityRoutes from "#routes/activity.route.js";
import checklistRoutes from "#routes/checklist.route.js";
import noteRoutes from "#routes/note.route.js";
import expenseRoutes from "#routes/expense.route.js";
import chatRoutes from "#routes/chat.route.js";
import photoRoutes from "#routes/photo.route.js";
import destinationRoutes from "#routes/destination.route.js";
import packingRoutes from "#routes/packing.route.js";
import profileRoutes from "#routes/profile.route.js";
import notificationRoutes from "#routes/notification.route.js";
import {
  errorHandler,
  notFoundHandler,
} from "#middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
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
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api", activityRoutes);
app.use("/api", checklistRoutes);
app.use("/api", noteRoutes);
app.use("/api", expenseRoutes);
app.use("/api", chatRoutes);
app.use("/api", photoRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api", packingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", notificationRoutes);

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

export default app;
