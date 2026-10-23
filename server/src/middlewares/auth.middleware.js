import mongoose from "mongoose";
import { jwtToken } from "#utils/jwt.js";
import { resolveSession } from "#services/session.service.js";

export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
      message: "No access token provided",
    });
  }

  let decoded;
  try {
    decoded = jwtToken.verify(token);
  } catch {
    return res.status(401).json({
      error: "Authentication failed",
      message: "Invalid or expired token",
    });
  }

  try {
    // Role and status come from the database, so blocking a user, changing
    // their role or revoking their sessions takes effect immediately
    const user = await resolveSession(decoded);
    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Session expired. Please sign in again.",
      });
    }
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "User not authenticated",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Insufficient permissions",
        });
      }

      next();
    } catch (e) {
      return res.status(500).json({
        error: "Internal server error",
        message: "Error during role verification",
      });
    }
  };
};

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 * Use this for endpoints that work for both authenticated and unauthenticated users
 */
export const optionalAuth = async (req, res, next) => {
  req.user = null;
  const token = req.cookies.token;
  if (token) {
    try {
      req.user = await resolveSession(jwtToken.verify(token));
    } catch {
      // Invalid token - continue without user
      req.user = null;
    }
  }
  next();
};
/*
 *
 * Middleware to check if user is a member of a trip
 * Requires authenticateToken to be called first
 * Trip ID should be in req.params.tripId
 */
export const isTripMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User not authenticated",
      });
    }

    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Trip ID is required",
      });
    }

    // Import Trip model dynamically to avoid circular dependencies
    const { default: Trip } = await import("#models/trip.model.js");

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Invalid trip ID",
      });
    }

    const trip = await Trip.findById(tripId);

    if (!trip || trip.isDeleted) {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    // Check if user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === req.user.id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not a member of this trip",
      });
    }

    // Attach trip to request for use in controller
    req.trip = trip;

    next();
  } catch (e) {
    return res.status(500).json({
      error: "Internal server error",
      message: "Error during trip membership verification",
    });
  }
};

/**
 * Middleware to check if user is the owner of a trip
 * Requires authenticateToken to be called first
 * Trip ID should be in req.params.tripId
 */
export const isTripOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User not authenticated",
      });
    }

    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Trip ID is required",
      });
    }

    // Import Trip model dynamically to avoid circular dependencies
    const { default: Trip } = await import("#models/trip.model.js");

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Invalid trip ID",
      });
    }

    const trip = await Trip.findById(tripId);

    if (!trip || trip.isDeleted) {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    // Check if user is the owner
    if (trip.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the trip owner can perform this action",
      });
    }

    // Attach trip to request for use in controller
    req.trip = trip;

    next();
  } catch (e) {
    return res.status(500).json({
      error: "Internal server error",
      message: "Error during trip ownership verification",
    });
  }
};
