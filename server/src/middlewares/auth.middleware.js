import { jwtToken } from '#utils/jwt.js';

export const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No access token provided',
      });
    }

    const decoded = jwtToken.verify(token);
    req.user = decoded;

    next();
  } catch (e) {

    if (e.message === 'Failed to authenticate token') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired token',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error during authentication',
    });
  }
};

export const requireRole = allowedRoles => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (e) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Error during role verification',
      });
    }
  };
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
        error: 'Authentication required',
        message: 'User not authenticated',
      });
    }

    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Trip ID is required',
      });
    }

    // Import Trip model dynamically to avoid circular dependencies
    const { default: Trip } = await import('#models/trip.model.js');

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    }

    // Check if user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === req.user.id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this trip',
      });
    }

    // Attach trip to request for use in controller
    req.trip = trip;

    next();
  } catch (e) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error during trip membership verification',
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
        error: 'Authentication required',
        message: 'User not authenticated',
      });
    }

    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Trip ID is required',
      });
    }

    // Import Trip model dynamically to avoid circular dependencies
    const { default: Trip } = await import('#models/trip.model.js');

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    }

    // Check if user is the owner
    if (trip.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the trip owner can perform this action',
      });
    }

    // Attach trip to request for use in controller
    req.trip = trip;

    next();
  } catch (e) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error during trip ownership verification',
    });
  }
};
