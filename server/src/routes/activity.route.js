import express from "express";
import {
  createActivityController,
  updateActivityController,
  deleteActivityController,
  getActivitiesController,
  getMapDataController,
} from "#controllers/activity.controller.js";
import {
  authenticateToken,
  isTripMember,
} from "#middlewares/auth.middleware.js";

const router = express.Router();

// All activity routes require authentication
router.use(authenticateToken);

// Get all activities for a trip (member only)
router.get("/trips/:tripId/activities", isTripMember, getActivitiesController);

// Get map data for a trip (member only)
router.get("/trips/:tripId/map", isTripMember, getMapDataController);

// Create a new activity for a trip (member only)
router.post(
  "/trips/:tripId/activities",
  isTripMember,
  createActivityController
);

// Update an activity (member only)
router.put(
  "/trips/:tripId/activities/:activityId",
  isTripMember,
  updateActivityController
);

// Delete an activity (member only)
router.delete(
  "/trips/:tripId/activities/:activityId",
  isTripMember,
  deleteActivityController
);

export default router;
