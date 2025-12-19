import express from "express";
import {
  sendInvitationController,
  acceptInvitationController,
  rejectInvitationController,
  cancelInvitationController,
  getPendingInvitationsController,
  getTripInvitationsController,
  getInvitationByIdController,
  getInvitationPreviewController,
} from "#controllers/invitation.controller.js";
import { authenticateToken } from "#middlewares/auth.middleware.js";

const router = express.Router();

// All invitation routes require authentication
router.use(authenticateToken);

// Get pending invitations for the authenticated user
router.get("/invitations/pending", getPendingInvitationsController);

// Get invitation with trip preview (for invited users to decide)
router.get(
  "/invitations/:invitationId/preview",
  getInvitationPreviewController
);

// Get invitation details by ID
router.get("/invitations/:invitationId", getInvitationByIdController);

// Accept an invitation
router.post("/invitations/:invitationId/accept", acceptInvitationController);

// Reject an invitation
router.post("/invitations/:invitationId/reject", rejectInvitationController);

// Cancel an invitation (by inviter)
router.delete("/invitations/:invitationId", cancelInvitationController);

// Get all invitations for a trip (owner only)
router.get("/trips/:tripId/invitations", getTripInvitationsController);

// Send invitation to a trip (moved from trip routes, but kept there for backward compatibility)
router.post("/trips/:tripId/invitations", sendInvitationController);

export default router;
