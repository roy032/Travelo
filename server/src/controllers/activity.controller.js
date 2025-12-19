import {
  createActivitySchema,
  updateActivitySchema,
} from '#validations/activity.validation.js';
import { formatValidationError } from '#utils/format.js';
import {
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitiesByTrip,
} from '#services/activity.service.js';
import {
  filterActivitiesWithCoordinates,
  calculateMapBounds,
} from '#utils/map.js';

/**
 * Create a new activity
 */
export const createActivityController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const validationResult = createActivitySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { title, description, date, time, location } = validationResult.data;

    // Convert date string to Date object
    const activityData = {
      trip: tripId,
      title,
      description,
      date: new Date(date),
      time,
      location,
      creator: req.user.id, // From authentication middleware
    };

    const activity = await createActivity(activityData);

    res.status(201).json({
      message: 'Activity created successfully',
      activity,
    });
  } catch (e) {
    if (e.message === 'Trip not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    }

    if (e.message === 'Activity date must be within trip date range') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Activity date must be within trip date range',
      });
    }

    next(e);
  }
};

/**
 * Update an existing activity
 */
export const updateActivityController = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    const validationResult = updateActivitySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const updateData = { ...validationResult.data };

    // Convert date string to Date object if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const activity = await updateActivity(activityId, req.user.id, updateData);

    res.status(200).json({
      message: 'Activity updated successfully',
      activity,
    });
  } catch (e) {
    if (e.message === 'Activity not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Activity not found',
      });
    }

    if (e.message === 'Activity date must be within trip date range') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Activity date must be within trip date range',
      });
    }

    next(e);
  }
};

/**
 * Delete an activity
 */
export const deleteActivityController = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    const result = await deleteActivity(activityId, req.user.id);

    res.status(200).json(result);
  } catch (e) {
    if (e.message === 'Activity not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Activity not found',
      });
    }

    next(e);
  }
};

/**
 * Get all activities for a trip
 */
export const getActivitiesController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const activities = await getActivitiesByTrip(tripId, req.user.id);

    res.status(200).json({
      activities,
      count: activities.length,
    });
  } catch (e) {
    if (e.message === 'Trip not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    }

    if (e.message === 'Access denied: You are not a member of this trip') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this trip',
      });
    }

    next(e);
  }
};

/**
 * Get map data for a trip
 * Returns activities with valid coordinates and calculated map bounds
 */
export const getMapDataController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Get all activities for the trip
    const activities = await getActivitiesByTrip(tripId, req.user.id);

    // Filter activities with valid coordinates
    const activitiesWithCoordinates = filterActivitiesWithCoordinates(activities);

    // Calculate map bounds
    const bounds = calculateMapBounds(activitiesWithCoordinates);

    res.status(200).json({
      activities: activitiesWithCoordinates,
      count: activitiesWithCoordinates.length,
      bounds,
    });
  } catch (e) {
    if (e.message === 'Trip not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    }

    if (e.message === 'Access denied: You are not a member of this trip') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this trip',
      });
    }

    next(e);
  }
};
