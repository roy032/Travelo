import express from "express";
import { userRateLimiter } from "#middlewares/rateLimit.middleware.js";
import {
  fetchTripMessages,
  sendTripMessage,
} from "#controllers/message.controller.js";
import {
  authenticateToken,
  isTripMember,
} from "#middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication and trip membership
router.use(authenticateToken);

// GET /trips/:tripId/messages - Get paginated messages
router.get("/:tripId/messages", isTripMember, fetchTripMessages);

// POST /trips/:tripId/messages - Send message (REST fallback)
router.post(
  "/:tripId/messages",
  isTripMember,
  userRateLimiter("message"),
  sendTripMessage
);

export default router;
