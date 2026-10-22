import express from "express";
import {
  getSharedTripController,
  sharedCalendarController,
} from "#controllers/share.controller.js";

const router = express.Router();

// PUBLIC ROUTES - anyone with the link can view the trip plan
router.get("/:token", getSharedTripController);
router.get("/:token/calendar.ics", sharedCalendarController);

export default router;
