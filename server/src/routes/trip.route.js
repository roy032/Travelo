import express from 'express';
import {
  createTripController,
  updateTripController,
  deleteTripController,
  getTripController,
  getUserTripsController,
  inviteMemberController,
  removeMemberController,
  getTripMembersController,
} from '#controllers/trip.controller.js';
import { authenticateToken, isTripMember, isTripOwner } from '#middlewares/auth.middleware.js';

const router = express.Router();

// All trip routes require authentication
router.use(authenticateToken);

// Create a new trip
router.post('/', createTripController);

// Get all trips for the authenticated user
router.get('/', getUserTripsController);

// Get a specific trip by ID (member only)
router.get('/:tripId', isTripMember, getTripController);

// Update a trip (owner only)
router.put('/:tripId', isTripOwner, updateTripController);

// Delete a trip (owner only)
router.delete('/:tripId', isTripOwner, deleteTripController);

// Get all members of a trip (member only)
router.get('/:tripId/members', isTripMember, getTripMembersController);

// Invite a member to a trip (owner only)
router.post('/:tripId/members', isTripOwner, inviteMemberController);

// Remove a member from a trip (owner only)
router.delete('/:tripId/members/:memberId', isTripOwner, removeMemberController);

export default router;
