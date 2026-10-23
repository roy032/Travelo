import express from "express";
import {
  applyPlanController,
  plannerStatusController,
  suggestPlanController,
} from "#controllers/aiPlanner.controller.js";
import {
  authenticateToken,
  isTripMember,
} from "#middlewares/auth.middleware.js";
import { createRateLimiter } from "#middlewares/rateLimit.middleware.js";

const router = express.Router();

const envInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

// Each plan is a paid Claude request, so limit how many one account can ask for
const planRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: envInt("AI_PLANNER_RATE_LIMIT_MAX", 10),
  message: "You've asked for a lot of plans, please try again later",
  keyGenerator: (req) => `planner:${req.user.id}`,
});

// Auth is applied per route: this router is mounted at /api
router.get("/ai-planner/status", authenticateToken, plannerStatusController);

router.post(
  "/trips/:tripId/ai-plan",
  authenticateToken,
  isTripMember,
  planRateLimiter,
  suggestPlanController
);

router.post(
  "/trips/:tripId/ai-plan/apply",
  authenticateToken,
  isTripMember,
  applyPlanController
);

export default router;
