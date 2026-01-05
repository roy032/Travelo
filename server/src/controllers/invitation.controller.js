import {
  sendInvitation,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  getPendingInvitations,
  getTripInvitations,
  getInvitationById,
  getInvitationWithTripPreview,
} from "#services/invitation.service.js";

/**
 * Send an invitation to join a trip
 */
export const sendInvitationController = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Email is required",
      });
    }

    const invitation = await sendInvitation(tripId, req.user.id, email);

    res.status(201).json({
      message: "Invitation sent successfully",
      invitation,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Only the trip owner can invite members") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can invite members",
      });
    }

    if (e.message === "User not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "User with this email not found",
      });
    }

    if (e.message === "User is already a member of this trip") {
      return res.status(409).json({
        error: "Conflict",
        message: "User is already a member of this trip",
      });
    }

    if (e.message === "User already has a pending invitation for this trip") {
      return res.status(409).json({
        error: "Conflict",
        message: "User already has a pending invitation for this trip",
      });
    }

    next(e);
  }
};

/**
 * Accept an invitation
 */
export const acceptInvitationController = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const result = await acceptInvitation(invitationId, req.user.id);

    res.status(200).json({
      message: "Invitation accepted successfully",
      ...result,
    });
  } catch (e) {
    if (e.message === "Invitation not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Invitation not found",
      });
    }

    if (e.message === "Access denied: You are not the invited user") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not authorized to accept this invitation",
      });
    }

    if (e.message.startsWith("Invitation has already been")) {
      return res.status(409).json({
        error: "Conflict",
        message: e.message,
      });
    }

    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    next(e);
  }
};

/**
 * Reject an invitation
 */
export const rejectInvitationController = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await rejectInvitation(invitationId, req.user.id);

    res.status(200).json({
      message: "Invitation declined successfully",
      invitation,
    });
  } catch (e) {
    if (e.message === "Invitation not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Invitation not found",
      });
    }

    if (e.message === "Access denied: You are not the invited user") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not authorized to decline this invitation",
      });
    }

    if (e.message.startsWith("Invitation has already been")) {
      return res.status(409).json({
        error: "Conflict",
        message: e.message,
      });
    }

    next(e);
  }
};

/**
 * Cancel an invitation (by inviter)
 */
export const cancelInvitationController = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await cancelInvitation(invitationId, req.user.id);

    res.status(200).json({
      message: "Invitation cancelled successfully",
      invitation,
    });
  } catch (e) {
    if (e.message === "Invitation not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Invitation not found",
      });
    }

    if (
      e.message === "Access denied: Only the inviter can cancel this invitation"
    ) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the inviter can cancel this invitation",
      });
    }

    if (e.message.startsWith("Cannot cancel invitation")) {
      return res.status(409).json({
        error: "Conflict",
        message: e.message,
      });
    }

    next(e);
  }
};

/**
 * Get pending invitations for the authenticated user
 */
export const getPendingInvitationsController = async (req, res, next) => {
  try {
    const invitations = await getPendingInvitations(req.user.id);

    res.status(200).json({
      invitations,
      count: invitations.length,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Get all invitations for a trip (owner only)
 */
export const getTripInvitationsController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const invitations = await getTripInvitations(tripId, req.user.id);

    res.status(200).json({
      invitations,
      count: invitations.length,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (
      e.message === "Access denied: Only the trip owner can view invitations"
    ) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can view invitations",
      });
    }

    next(e);
  }
};

/**
 * Get invitation details by ID
 */
export const getInvitationByIdController = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await getInvitationById(invitationId, req.user.id);

    res.status(200).json({
      invitation,
    });
  } catch (e) {
    if (e.message === "Invitation not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Invitation not found",
      });
    }

    if (e.message === "Access denied") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not authorized to view this invitation",
      });
    }

    next(e);
  }
};

/**
 * Get invitation with detailed trip preview (for invited users)
 */
export const getInvitationPreviewController = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const data = await getInvitationWithTripPreview(invitationId, req.user.id);

    res.status(200).json(data);
  } catch (e) {
    if (e.message === "Invitation not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Invitation not found",
      });
    }

    if (e.message === "Access denied: You are not the invited user") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not authorized to view this invitation",
      });
    }

    next(e);
  }
};
