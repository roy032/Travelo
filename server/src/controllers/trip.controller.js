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
