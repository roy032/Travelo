import express from "express";
import { reportTrip } from "#controllers/report.controller.js";
import { optionalAuth } from "#middlewares/auth.middleware.js";
import { userRateLimiter } from "#middlewares/rateLimit.middleware.js";

const router = express.Router();

// User endpoint to report a trip
// POST /trips/:tripId/report
// Works for both authenticated and unauthenticated users
router.post("/:tripId/report", optionalAuth, userRateLimiter("report"), reportTrip);

export default router;
