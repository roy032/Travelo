import {
  createTripSchema,
  updateTripSchema,
} from "#validations/trip.validation.js";
import { formatValidationError } from "#utils/format.js";
import {
  createTrip,
  updateTrip,
  deleteTrip,
  getTripById,
  getUserTrips,
  inviteMember,
  removeMember,
  getTripMembers,
  getPublicUpcomingTrips,
} from "#services/trip.service.js";
import User from "#models/user.model.js";

/**
 * Create a new trip
 */
export const createTripController = async (req, res, next) => {
  try {
    const validationResult = createTripSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      destinationType,
      tripCategory,
    } = validationResult.data;

    // Fetch user to check trip-specific verification
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User account not found",
      });
    }

    // Check verification based on trip category
    if (tripCategory === "domestic") {
      if (user.domesticVerification?.status !== "verified") {
        return res.status(403).json({
          error: "Verification required",
          message:
            "You must upload and verify your NID to create domestic trips.",
          requiredDocument: "NID",
          tripCategory: "domestic",
        });
      }
    } else if (tripCategory === "international") {
      if (user.internationalVerification?.status !== "verified") {
        return res.status(403).json({
          error: "Verification required",
          message:
            "You must upload and verify your passport to create international trips.",
          requiredDocument: "Passport",
          tripCategory: "international",
        });
      }
    }

    // Convert date strings to Date objects
    const tripData = {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      destinationType,
      tripCategory,
      owner: req.user.id, // From authentication middleware
    };

    const trip = await createTrip(tripData);

    res.status(201).json({
      message: "Trip created successfully",
      trip,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Update an existing trip
 */
export const updateTripController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const validationResult = updateTripSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const updateData = { ...validationResult.data };

    // Convert date strings to Date objects if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const trip = await updateTrip(tripId, req.user.id, updateData);

    res.status(200).json({
      message: "Trip updated successfully",
      trip,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "This trip has been deleted and cannot be updated") {
      return res.status(410).json({
        error: "Trip deleted",
        message: "This trip has been removed and cannot be updated",
        isDeleted: true,
      });
    }

    if (e.message === "Only the trip owner can update trip details") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can update trip details",
      });
    }

    next(e);
  }
};

/**
 * Delete a trip
 */
export const deleteTripController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const result = await deleteTrip(tripId, req.user.id);

    res.status(200).json(result);
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Trip is already deleted") {
      return res.status(400).json({
        error: "Invalid operation",
        message: "Trip is already deleted",
      });
    }

    if (e.message === "Only the trip owner can delete the trip") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can delete the trip",
      });
    }

    next(e);
  }
};

/**
 * Get a single trip by ID
 */
export const getTripController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await getTripById(tripId, req.user.id);

    res.status(200).json({
      trip,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "This trip has been deleted") {
      return res.status(410).json({
        error: "Trip deleted",
        message: "This trip has been removed and is no longer accessible",
        isDeleted: true,
      });
    }

    if (e.message === "Access denied: You are not a member of this trip") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not a member of this trip",
      });
    }

    next(e);
  }
};

/**
 * Get all trips for the authenticated user
 */
export const getUserTripsController = async (req, res, next) => {
  try {
    // Extract query parameters
    const { filter, search, sortBy, sortOrder } = req.query;

    // Build options object
    const options = {};
    if (filter) options.filter = filter;
    if (search) options.search = search;
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder) options.sortOrder = sortOrder;

    const trips = await getUserTrips(req.user.id, options);

    res.status(200).json({
      trips,
      count: trips.length,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Invite a member to a trip
 */
export const inviteMemberController = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Email is required",
      });
    }

    const trip = await inviteMember(tripId, req.user.id, email);

    res.status(200).json({
      message: "Member invited successfully",
      trip,
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

    next(e);
  }
};

/**
 * Remove a member from a trip
 */
export const removeMemberController = async (req, res, next) => {
  try {
    const { tripId, memberId } = req.params;

    const trip = await removeMember(tripId, req.user.id, memberId);

    res.status(200).json({
      message: "Member removed successfully",
      trip,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Only the trip owner can remove members") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can remove members",
      });
    }

    if (e.message === "Trip owner cannot remove themselves from the trip") {
      return res.status(400).json({
        error: "Validation failed",
        message: "Trip owner cannot remove themselves from the trip",
      });
    }

    if (e.message === "User is not a member of this trip") {
      return res.status(404).json({
        error: "Resource not found",
        message: "User is not a member of this trip",
      });
    }

    next(e);
  }
};

/**
 * Get all members of a trip
 */
export const getTripMembersController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const members = await getTripMembers(tripId, req.user.id);

    res.status(200).json({
      members,
      count: members.length,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Access denied: You are not a member of this trip") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not a member of this trip",
      });
    }

    next(e);
  }
};

/**
 * Get all upcoming trips for public exploration (NO AUTH REQUIRED)
 * Returns sanitized trip data with activities and checklist only
 */
export const getPublicTripsController = async (req, res, next) => {
  try {
    const trips = await getPublicUpcomingTrips();

    res.status(200).json({
      trips,
      count: trips.length,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Request to join a trip (AUTH REQUIRED)
 * Creates a notification for trip creator/admins
 */
export const requestJoinTripController = async (req, res, next) => {
  try {
    const { id: tripId } = req.params;
    const userId = req.user.id;

    // Import Trip model directly to bypass member check
    const Trip = (await import("#models/trip.model.js")).default;
    const User = (await import("#models/user.model.js")).default;
    const Notification = (await import("#models/notification.model.js"))
      .default;

    // Get trip details without member restriction
    const trip = await Trip.findById(tripId)
      .populate("owner", "firstName lastName email")
      .populate("members", "_id firstName lastName email");

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found",
        message: "The trip you're trying to join does not exist",
      });
    }

    if (trip.isDeleted) {
      return res.status(410).json({
        error: "Trip deleted",
        message:
          "This trip has been removed and is no longer accepting members",
        isDeleted: true,
      });
    }

    // Check if user is already a member
    const isMember = trip.members.some(
      (member) => member._id.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({
        error: "Already a member",
        message: "You are already a member of this trip",
      });
    }

    // Check if user is the creator
    if (trip.owner._id.toString() === userId) {
      return res.status(400).json({
        error: "Invalid request",
        message: "You are the creator of this trip",
      });
    }

    const requestingUser = await User.findById(userId);

    if (!requestingUser) {
      return res.status(404).json({
        error: "User not found",
        message: "Your user account was not found",
      });
    }

    // Check verification based on trip category
    if (trip.tripCategory === "domestic") {
      if (requestingUser.domesticVerification?.status !== "verified") {
        return res.status(403).json({
          error: "Verification required",
          message:
            "You must upload and verify your NID to join domestic trips.",
          requiredDocument: "NID",
          tripCategory: "domestic",
        });
      }
    } else if (trip.tripCategory === "international") {
      if (requestingUser.internationalVerification?.status !== "verified") {
        return res.status(403).json({
          error: "Verification required",
          message:
            "You must upload and verify your passport to join international trips.",
          requiredDocument: "Passport",
          tripCategory: "international",
        });
      }
    }

    await Notification.create({
      user: trip.owner._id,
      type: "join_request",
      title: "New Join Request",
      message: `${requestingUser.name}  wants to join "${trip.title}"`,
      relatedTrip: trip._id,
      relatedResource: userId,
    });

    res.status(200).json({
      message: "Join request sent successfully",
      tripTitle: trip.title,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Get all join requests for a trip (OWNER ONLY)
 */
export const getJoinRequestsController = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const Trip = (await import("#models/trip.model.js")).default;
    const Notification = (await import("#models/notification.model.js"))
      .default;
    const User = (await import("#models/user.model.js")).default;

    // Check if user is the owner
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found",
        message: "The trip does not exist",
      });
    }

    if (trip.isDeleted) {
      return res.status(410).json({
        error: "Trip deleted",
        message: "This trip has been removed",
        isDeleted: true,
      });
    }

    if (trip.owner.toString() !== userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can view join requests",
      });
    }

    // Get all pending join request notifications for this trip
    // Don't filter by isRead - keep showing until accepted/rejected
    const requests = await Notification.find({
      user: userId,
      type: "join_request",
      relatedTrip: tripId,
    })
      .populate("relatedResource", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Filter out requests where the user is already a member
    const validRequests = [];
    for (const request of requests) {
      const requesterId = request.relatedResource?._id;
      if (requesterId) {
        const isMember = trip.members.some(
          (memberId) => memberId.toString() === requesterId.toString()
        );
        // Only include if requester is not already a member
        if (!isMember) {
          validRequests.push(request);
        }
      }
    }

    res.status(200).json({
      requests: validRequests,
      count: validRequests.length,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Accept a join request (OWNER ONLY)
 */
export const acceptJoinRequestController = async (req, res, next) => {
  try {
    const { tripId, notificationId } = req.params;
    const userId = req.user.id;

    const Trip = (await import("#models/trip.model.js")).default;
    const Notification = (await import("#models/notification.model.js"))
      .default;

    // Get the notification and trip
    const notification = await Notification.findById(notificationId);
    const trip = await Trip.findById(tripId);

    if (!notification || !trip) {
      return res.status(404).json({
        error: "Not found",
        message: "Request or trip not found",
      });
    }

    if (trip.isDeleted) {
      return res.status(410).json({
        error: "Trip deleted",
        message: "This trip has been removed and cannot accept new members",
        isDeleted: true,
      });
    }

    // Verify user is the owner
    if (trip.owner.toString() !== userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can accept requests",
      });
    }

    // Verify notification belongs to this user and trip
    if (
      notification.user.toString() !== userId ||
      notification.relatedTrip.toString() !== tripId
    ) {
      return res.status(403).json({
        error: "Access denied",
        message: "Invalid request",
      });
    }

    const requesterId = notification.relatedResource;

    // Check if already a member
    const isMember = trip.members.some(
      (member) => member.toString() === requesterId.toString()
    );

    if (isMember) {
      // Mark notification as read and return
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      return res.status(400).json({
        error: "Already a member",
        message: "User is already a member of this trip",
      });
    }

    // Add user to trip members
    trip.members.push(requesterId);
    await trip.save();

    // Mark notification as read
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    // Create notification for the requester
    await Notification.create({
      user: requesterId,
      type: "trip_invite_accepted",
      title: "Join Request Accepted",
      message: `Your request to join "${trip.title}" has been accepted!`,
      relatedTrip: trip._id,
    });

    res.status(200).json({
      message: "Join request accepted successfully",
      trip,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Reject a join request (OWNER ONLY)
 */
export const rejectJoinRequestController = async (req, res, next) => {
  try {
    const { tripId, notificationId } = req.params;
    const userId = req.user.id;

    const Trip = (await import("#models/trip.model.js")).default;
    const Notification = (await import("#models/notification.model.js"))
      .default;

    // Get the notification and trip
    const notification = await Notification.findById(notificationId);
    const trip = await Trip.findById(tripId);

    if (!notification || !trip) {
      return res.status(404).json({
        error: "Not found",
        message: "Request or trip not found",
      });
    }

    if (trip.isDeleted) {
      return res.status(410).json({
        error: "Trip deleted",
        message: "This trip has been removed",
        isDeleted: true,
      });
    }

    // Verify user is the owner
    if (trip.owner.toString() !== userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can reject requests",
      });
    }

    // Verify notification belongs to this user and trip
    if (
      notification.user.toString() !== userId ||
      notification.relatedTrip.toString() !== tripId
    ) {
      return res.status(403).json({
        error: "Access denied",
        message: "Invalid request",
      });
    }

    const requesterId = notification.relatedResource;

    // Mark notification as read
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    // Create notification for the requester
    await Notification.create({
      user: requesterId,
      type: "trip_invite_rejected",
      title: "Join Request Declined",
      message: `Your request to join "${trip.title}" has been declined`,
      relatedTrip: trip._id,
    });

    res.status(200).json({
      message: "Join request rejected",
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete trip by admin (soft delete)
 * Admin only - marks trip as deleted
 */
export const deleteTripByAdmin = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const adminId = req.user.id;

    // Import Trip and Report models
    const Trip = (await import("#models/trip.model.js")).default;
    const Report = (await import("#models/report.model.js")).default;
    const Notification = (await import("#models/notification.model.js"))
      .default;

    // Find the trip
    const trip = await Trip.findById(tripId).populate("owner", "name email");

    if (!trip) {
      return res.status(404).json({
        error: "Not found",
        message: "Trip not found",
      });
    }

    if (trip.isDeleted) {
      return res.status(400).json({
        error: "Invalid operation",
        message: "Trip is already deleted",
      });
    }

    // Soft delete the trip
    trip.isDeleted = true;
    trip.deletedAt = new Date();
    trip.deletedBy = adminId;
    await trip.save();

    // Update all related reports to "resolved" status
    await Report.updateMany(
      { trip: tripId, status: "pending" },
      {
        status: "resolved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        resolution: "Trip has been removed by admin",
      }
    );

    // Notify trip owner
    await Notification.create({
      user: trip.owner._id,
      type: "trip_removed",
      title: "Trip Removed",
      message: `Your trip "${trip.title}" has been removed by an administrator`,
      relatedTrip: trip._id,
    });

    // Notify all members
    if (trip.members && trip.members.length > 0) {
      const memberNotifications = trip.members
        .filter((memberId) => memberId.toString() !== trip.owner._id.toString())
        .map((memberId) => ({
          user: memberId,
          type: "trip_removed",
          title: "Trip Removed",
          message: `The trip "${trip.title}" has been removed by an administrator`,
          relatedTrip: trip._id,
        }));

      if (memberNotifications.length > 0) {
        await Notification.insertMany(memberNotifications);
      }
    }

    res.status(200).json({
      message: "Trip deleted successfully",
      trip: {
        _id: trip._id,
        title: trip.title,
        isDeleted: trip.isDeleted,
        deletedAt: trip.deletedAt,
      },
    });
  } catch (e) {
    next(e);
  }
};
