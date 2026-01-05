import Activity from "#models/activity.model.js";
import Trip from "#models/trip.model.js";
import Notification from "#models/notification.model.js";

/**
 * Create a new activity
 * @param {Object} activityData - Activity creation data
 * @param {string} activityData.trip - Trip ID
 * @param {string} activityData.title - Activity title
 * @param {string} activityData.description - Activity description
 * @param {Date} activityData.date - Activity date
 * @param {string} activityData.time - Activity time (HH:MM format)
 * @param {Object} activityData.location - Location object
 * @param {string} activityData.location.name - Location name
 * @param {string} activityData.location.address - Location address (optional)
 * @param {Object} activityData.location.coordinates - Coordinates (optional)
 * @param {number} activityData.location.coordinates.lat - Latitude
 * @param {number} activityData.location.coordinates.lng - Longitude
 * @param {string} activityData.creator - User ID of the creator
 * @returns {Promise<Object>} Created activity object
 * @throws {Error} If validation fails or date is outside trip range
 */
export const createActivity = async (activityData) => {
  try {
    const { trip, title, description, date, time, location, creator } =
      activityData;

    // Create new activity (pre-save hook will validate date range)
    const activity = new Activity({
      trip,
      title,
      description,
      date,
      time,
      location,
      creator,
    });

    await activity.save();

    // Populate creator information
    await activity.populate("creator", "name email");

    // Get all trip members for notifications
    const tripDoc = await Trip.findById(trip).populate("members", "_id");

    if (tripDoc) {
      // Create notifications for all trip members
      const notifications = tripDoc.members
        .filter((member) => member._id.toString() !== creator.toString())
        .map((member) => ({
          user: member._id,
          type: "activity_added",
          title: "New Activity Added",
          message: `A new activity "${title}" has been added to the trip`,
          relatedTrip: trip,
          relatedResource: activity._id,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    return {
      id: activity._id,
      trip: activity.trip,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      creator: activity.creator,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Update an existing activity
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID attempting the update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated activity object
 * @throws {Error} If activity not found
 */
export const updateActivity = async (activityId, userId, updateData) => {
  try {
    // Find the activity
    const activity = await Activity.findById(activityId);

    if (!activity) {
      throw new Error("Activity not found");
    }

    // Update allowed fields
    const allowedUpdates = ["title", "description", "date", "time", "location"];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        activity[field] = updateData[field];
      }
    });

    // Save will trigger pre-save hook for date validation
    await activity.save();
    await activity.populate("creator", "name email");

    // Get all trip members for notifications
    const tripDoc = await Trip.findById(activity.trip).populate(
      "members",
      "_id"
    );

    if (tripDoc) {
      // Create notifications for all trip members except the updater
      const notifications = tripDoc.members
        .filter((member) => member._id.toString() !== userId.toString())
        .map((member) => ({
          user: member._id,
          type: "activity_added",
          title: "Activity Updated",
          message: `The activity "${activity.title}" has been updated`,
          relatedTrip: activity.trip,
          relatedResource: activity._id,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    return {
      id: activity._id,
      trip: activity.trip,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      creator: activity.creator,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Delete an activity
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID attempting the deletion
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {Error} If activity not found
 */
export const deleteActivity = async (activityId, userId) => {
  try {
    // Find the activity
    const activity = await Activity.findById(activityId);

    if (!activity) {
      throw new Error("Activity not found");
    }

    const tripId = activity.trip;
    const activityTitle = activity.title;

    // Delete the activity
    await Activity.findByIdAndDelete(activityId);

    // Get all trip members for notifications
    const tripDoc = await Trip.findById(tripId).populate("members", "_id");

    if (tripDoc) {
      // Create notifications for all trip members except the deleter
      const notifications = tripDoc.members
        .filter((member) => member._id.toString() !== userId.toString())
        .map((member) => ({
          user: member._id,
          type: "activity_added",
          title: "Activity Deleted",
          message: `The activity "${activityTitle}" has been deleted`,
          relatedTrip: tripId,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    return {
      message: "Activity deleted successfully",
      activityId,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all activities for a trip with chronological sorting
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the activities
 * @returns {Promise<Array>} Array of activity objects sorted chronologically
 * @throws {Error} If trip not found or user is not a member
 */
export const getActivitiesByTrip = async (tripId, userId) => {
  try {
    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error("Access denied: You are not a member of this trip");
    }

    // Get all activities for the trip, sorted chronologically
    const activities = await Activity.find({ trip: tripId })
      .populate("creator", "name email")
      .sort({ date: 1, time: 1 }); // Sort by date ascending, then by time

    return activities.map((activity) => ({
      id: activity._id,
      trip: activity.trip,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      creator: activity.creator,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    }));
  } catch (e) {
    throw e;
  }
};
