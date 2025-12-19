import Invitation from "#models/invitation.model.js";
import Trip from "#models/trip.model.js";
import User from "#models/user.model.js";
import Notification from "#models/notification.model.js";

/**
 * Send an invitation to join a trip
 * @param {string} tripId - Trip ID
 * @param {string} inviterId - User ID of the person sending the invitation
 * @param {string} email - Email of the user to invite
 * @returns {Promise<Object>} Created invitation
 * @throws {Error} If validation fails
 */
export const sendInvitation = async (tripId, inviterId, email) => {
  try {
    // Find the trip
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Verify ownership
    if (trip.owner.toString() !== inviterId.toString()) {
      throw new Error("Only the trip owner can invite members");
    }

    // Find the user to invite by email
    const userToInvite = await User.findOne({ email: email.toLowerCase() });

    if (!userToInvite) {
      throw new Error("User not found");
    }

    // Check if user is already a member
    const isAlreadyMember = trip.members.some(
      (memberId) => memberId.toString() === userToInvite._id.toString()
    );

    if (isAlreadyMember) {
      throw new Error("User is already a member of this trip");
    }

    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({
      trip: tripId,
      invitedUser: userToInvite._id,
      status: "pending",
    });

    if (existingInvitation) {
      throw new Error("User already has a pending invitation for this trip");
    }

    // Create invitation
    const invitation = await Invitation.create({
      trip: tripId,
      invitedBy: inviterId,
      invitedUser: userToInvite._id,
      status: "pending",
    });

    // Populate invitation details for response
    await invitation.populate("trip", "title description startDate endDate");
    await invitation.populate("invitedBy", "name email");
    await invitation.populate("invitedUser", "name email");

    // Create notification for the invitee
    await Notification.create({
      user: userToInvite._id,
      type: "trip_invite",
      title: "Trip Invitation",
      message: `${invitation.invitedBy.name} has invited you to join the trip "${trip.title}"`,
      relatedTrip: trip._id,
      relatedResource: invitation._id,
    });

    // Create notification for the inviter
    await Notification.create({
      user: inviterId,
      type: "trip_invite_sent",
      title: "Invitation Sent",
      message: `Your invitation to ${userToInvite.name} for "${trip.title}" has been sent`,
      relatedTrip: trip._id,
      relatedResource: invitation._id,
    });

    return invitation;
  } catch (e) {
    throw e;
  }
};

/**
 * Accept an invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID of the person accepting
 * @returns {Promise<Object>} Updated invitation and trip
 * @throws {Error} If validation fails
 */
export const acceptInvitation = async (invitationId, userId) => {
  try {
    // Find invitation
    const invitation = await Invitation.findById(invitationId)
      .populate("trip", "title description startDate endDate owner members")
      .populate("invitedBy", "name email")
      .populate("invitedUser", "name email");

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify the user is the invitee
    if (invitation.invitedUser._id.toString() !== userId.toString()) {
      throw new Error("Access denied: You are not the invited user");
    }

    // Check if already accepted or rejected
    if (invitation.status !== "pending") {
      throw new Error(`Invitation has already been ${invitation.status}`);
    }

    // Add user to trip members
    const trip = await Trip.findById(invitation.trip._id);

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Check if already a member (edge case)
    const isAlreadyMember = trip.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isAlreadyMember) {
      trip.members.push(userId);
      await trip.save();
    }

    // Update invitation status
    invitation.status = "accepted";
    invitation.respondedAt = new Date();
    await invitation.save();

    // Create notification for the inviter
    await Notification.create({
      user: invitation.invitedBy._id,
      type: "trip_invite_accepted",
      title: "Invitation Accepted",
      message: `${invitation.invitedUser.name} has accepted your invitation to join "${invitation.trip.title}"`,
      relatedTrip: invitation.trip._id,
      relatedResource: invitation._id,
    });

    // Create confirmation notification for the invitee
    await Notification.create({
      user: userId,
      type: "trip_invite_accepted",
      title: "Invitation Accepted",
      message: `You have joined the trip "${invitation.trip.title}"`,
      relatedTrip: invitation.trip._id,
      relatedResource: invitation._id,
    });

    return {
      invitation,
      trip: await Trip.findById(invitation.trip._id)
        .populate("owner", "name email")
        .populate("members", "name email"),
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Reject an invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID of the person rejecting
 * @returns {Promise<Object>} Updated invitation
 * @throws {Error} If validation fails
 */
export const rejectInvitation = async (invitationId, userId) => {
  try {
    // Find invitation
    const invitation = await Invitation.findById(invitationId)
      .populate("trip", "title description startDate endDate")
      .populate("invitedBy", "name email")
      .populate("invitedUser", "name email");

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify the user is the invitee
    if (invitation.invitedUser._id.toString() !== userId.toString()) {
      throw new Error("Access denied: You are not the invited user");
    }

    // Check if already accepted or rejected
    if (invitation.status !== "pending") {
      throw new Error(`Invitation has already been ${invitation.status}`);
    }

    // Update invitation status
    invitation.status = "rejected";
    invitation.respondedAt = new Date();
    await invitation.save();

    // Create notification for the inviter
    await Notification.create({
      user: invitation.invitedBy._id,
      type: "trip_invite_rejected",
      title: "Invitation Declined",
      message: `${invitation.invitedUser.name} has declined your invitation to join "${invitation.trip.title}"`,
      relatedTrip: invitation.trip._id,
      relatedResource: invitation._id,
    });

    return invitation;
  } catch (e) {
    throw e;
  }
};

/**
 * Cancel an invitation (by inviter)
 * @param {string} invitationId - Invitation ID
 * @param {string} inviterId - User ID of the person who sent the invitation
 * @returns {Promise<Object>} Updated invitation
 * @throws {Error} If validation fails
 */
export const cancelInvitation = async (invitationId, inviterId) => {
  try {
    // Find invitation
    const invitation = await Invitation.findById(invitationId)
      .populate("trip", "title")
      .populate("invitedUser", "name email");

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify the user is the inviter
    if (invitation.invitedBy.toString() !== inviterId.toString()) {
      throw new Error(
        "Access denied: Only the inviter can cancel this invitation"
      );
    }

    // Check if still pending
    if (invitation.status !== "pending") {
      throw new Error(`Cannot cancel invitation that is ${invitation.status}`);
    }

    // Update invitation status
    invitation.status = "cancelled";
    invitation.respondedAt = new Date();
    await invitation.save();

    return invitation;
  } catch (e) {
    throw e;
  }
};

/**
 * Get pending invitations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of pending invitations
 */
export const getPendingInvitations = async (userId) => {
  try {
    const invitations = await Invitation.find({
      invitedUser: userId,
      status: "pending",
    })
      .populate(
        "trip",
        "title description startDate endDate destinationType tripCategory"
      )
      .populate("invitedBy", "name email")
      .populate("invitedUser", "name email")
      .sort({ createdAt: -1 });

    return invitations;
  } catch (e) {
    throw e;
  }
};

/**
 * Get all invitations for a trip (for owner)
 * @param {string} tripId - Trip ID
 * @param {string} ownerId - Owner ID (for verification)
 * @returns {Promise<Array>} Array of invitations
 */
export const getTripInvitations = async (tripId, ownerId) => {
  try {
    // Verify trip ownership
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (trip.owner.toString() !== ownerId.toString()) {
      throw new Error(
        "Access denied: Only the trip owner can view invitations"
      );
    }

    const invitations = await Invitation.find({ trip: tripId })
      .populate("invitedBy", "name email")
      .populate("invitedUser", "name email")
      .sort({ createdAt: -1 });

    return invitations;
  } catch (e) {
    throw e;
  }
};

/**
 * Get invitation by ID
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID (for access verification)
 * @returns {Promise<Object>} Invitation details
 */
export const getInvitationById = async (invitationId, userId) => {
  try {
    const invitation = await Invitation.findById(invitationId)
      .populate("trip", "title description startDate endDate owner")
      .populate("invitedBy", "name email")
      .populate("invitedUser", "name email");

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify user is either inviter or invitee
    const isInviter = invitation.invitedBy._id.toString() === userId.toString();
    const isInvitee =
      invitation.invitedUser._id.toString() === userId.toString();

    if (!isInviter && !isInvitee) {
      throw new Error("Access denied");
    }

    return invitation;
  } catch (e) {
    throw e;
  }
};

/**
 * Get invitation with detailed trip preview (for invited users to see before accepting)
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID (must be the invited user)
 * @returns {Promise<Object>} Invitation with trip preview details
 */
export const getInvitationWithTripPreview = async (invitationId, userId) => {
  try {
    const invitation = await Invitation.findById(invitationId)
      .populate(
        "trip",
        "title description startDate endDate destinationType tripCategory"
      )
      .populate("invitedBy", "name email")
      .populate("invitedUser", "name email");

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify user is the invitee
    if (invitation.invitedUser._id.toString() !== userId.toString()) {
      throw new Error("Access denied: You are not the invited user");
    }

    // Import Activity and ChecklistItem models
    const Activity = (await import("#models/activity.model.js")).default;
    const ChecklistItem = (await import("#models/checklist.model.js")).default;

    // Get activity count and sample activities
    const activities = await Activity.find({ trip: invitation.trip._id })
      .select("title date time location")
      .sort({ date: 1, time: 1 })
      .limit(5);

    // Get checklist count
    const checklistCount = await ChecklistItem.countDocuments({
      trip: invitation.trip._id,
    });

    // Get member count
    const trip = await Trip.findById(invitation.trip._id);
    const memberCount = trip ? trip.members.length : 0;

    return {
      invitation: {
        id: invitation._id,
        status: invitation.status,
        createdAt: invitation.createdAt,
        respondedAt: invitation.respondedAt,
        invitedBy: {
          name: invitation.invitedBy.name,
          email: invitation.invitedBy.email,
        },
      },
      trip: {
        id: invitation.trip._id,
        title: invitation.trip.title,
        description: invitation.trip.description,
        startDate: invitation.trip.startDate,
        endDate: invitation.trip.endDate,
        destinationType: invitation.trip.destinationType,
        tripCategory: invitation.trip.tripCategory,
        memberCount,
        activityCount: activities.length,
        activities: activities.map((act) => ({
          title: act.title,
          date: act.date,
          time: act.time,
          location: act.location?.name || null,
        })),
        checklistCount,
      },
    };
  } catch (e) {
    throw e;
  }
};
