import express from "express";
import mongoose from "mongoose";

const router = express.Router();

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

/**
 * Health check for uptime monitors and the hosting platform.
 * Returns 503 when the database is unreachable so monitors alert on it.
 */
router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const healthy = dbState === 1;

  res.set("Cache-Control", "no-store");
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database: DB_STATES[dbState] || "unknown",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
