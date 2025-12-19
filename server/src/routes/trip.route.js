import express from "express";
import {
  createTripController,
  updateTripController,
  deleteTripController,
  getTripController,
  getUserTripsController,
  inviteMemberController,
  removeMemberController,
  getTripMembersController,
  getPublicTripsController,
  requestJoinTripController,
  getJoinRequestsController,
  acceptJoinRequestController,
  rejectJoinRequestController,
} from "#controllers/trip.controller.js";
import {
  authenticateToken,
  isTripMember,
  isTripOwner,
} from "#middlewares/auth.middleware.js";

const router = express.Router();

// PUBLIC ROUTE - No authentication required
// Get all upcoming trips for public exploration
router.get("/explore", getPublicTripsController);

// All remaining trip routes require authentication
router.use(authenticateToken);

// Create a new trip
router.post("/", createTripController);

// Get all trips for the authenticated user
router.get("/", getUserTripsController);

// Get a specific trip by ID (member only)
router.get("/:tripId", isTripMember, getTripController);

// Request to join a trip (authenticated users only)
router.post("/:id/join-request", requestJoinTripController);

// Get join requests for a trip (owner only)
router.get("/:tripId/join-requests", isTripOwner, getJoinRequestsController);

// Accept a join request (owner only)
router.post(
  "/:tripId/join-requests/:notificationId/accept",
  isTripOwner,
  acceptJoinRequestController
);

// Reject a join request (owner only)
router.post(
  "/:tripId/join-requests/:notificationId/reject",
  isTripOwner,
  rejectJoinRequestController
);

// Update a trip (owner only)
router.put("/:tripId", isTripOwner, updateTripController);

// Delete a trip (owner only)
router.delete("/:tripId", isTripOwner, deleteTripController);

// Get all members of a trip (member only)
router.get("/:tripId/members", isTripMember, getTripMembersController);

// Invite a member to a trip (owner only)
router.post("/:tripId/members", isTripOwner, inviteMemberController);

// Remove a member from a trip (owner only)
router.delete(
  "/:tripId/members/:memberId",
  isTripOwner,
  removeMemberController
);

export default router;
