import Trip from "#models/trip.model.js";
import Notification from "#models/notification.model.js";
import User from "#models/user.model.js";

/**
 * Create a new trip
 * @param {Object} tripData - Trip creation data
 * @param {string} tripData.title - Trip title
 * @param {string} tripData.description - Trip description
 * @param {Date} tripData.startDate - Trip start date
 * @param {Date} tripData.endDate - Trip end date
 * @param {string} tripData.destinationType - Type of destination
 * @param {string} tripData.tripCategory - Trip category (domestic/international)
 * @param {string} tripData.owner - User ID of the trip owner
 * @returns {Promise<Object>} Created trip object
 * @throws {Error} If validation fails
 */
export const createTrip = async ({
  title,
  description,
  startDate,
  endDate,
  destinationType,
  tripCategory,
  owner,
}) => {
  try {
    // Create new trip with owner as initial member
    const trip = new Trip({
      title,
      description,
      startDate,
      endDate,
      destinationType,
      tripCategory,
      owner,
      members: [owner], // Owner is automatically added as a member
    });

    await trip.save();

    // Populate owner information
    await trip.populate("owner", "name email");

    return {
      id: trip._id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      destinationType: trip.destinationType,
      tripCategory: trip.tripCategory,
      owner: trip.owner,
      members: trip.members,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Update an existing trip
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID attempting the update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated trip object
 * @throws {Error} If trip not found or user is not the owner
 */
export const updateTrip = async (tripId, userId, updateData) => {
  try {
    // Find the trip
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (trip.isDeleted) {
      throw new Error("This trip has been deleted and cannot be updated");
    }

    // Verify ownership
    if (trip.owner.toString() !== userId.toString()) {
      throw new Error("Only the trip owner can update trip details");
    }

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "startDate",
      "endDate",
      "destinationType",
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        trip[field] = updateData[field];
      }
    });

    await trip.save();
    await trip.populate("owner", "name email");

    return {
      id: trip._id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      destinationType: trip.destinationType,
      owner: trip.owner,
      members: trip.members,
      updatedAt: trip.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Delete a trip (soft delete - marks as inactive)
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID attempting the deletion
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {Error} If trip not found or user is not the owner
 */
export const deleteTrip = async (tripId, userId) => {
  try {
    // Find the trip
    const trip = await Trip.findById(tripId).populate("members", "name email");

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Check if already deleted
    if (trip.isDeleted) {
      throw new Error("Trip is already deleted");
    }

    // Verify ownership
    if (trip.owner.toString() !== userId.toString()) {
      throw new Error("Only the trip owner can delete the trip");
    }

    // Get all member IDs for notifications
    const memberIds = trip.members.map((member) => member._id);

    // Soft delete the trip
    trip.isDeleted = true;
    trip.deletedAt = new Date();
    trip.deletedBy = userId;
    await trip.save();

    // Create notifications for all members about trip deletion
    const notifications = memberIds
      .filter((memberId) => memberId.toString() !== userId.toString())
      .map((memberId) => ({
        user: memberId,
        type: "member_removed",
        title: "Trip Deleted",
        message: `The trip "${trip.title}" has been deleted by the owner`,
        relatedTrip: tripId,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return {
      message: "Trip deleted successfully",
      tripId,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get a trip by ID
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the trip
 * @returns {Promise<Object>} Trip object
 * @throws {Error} If trip not found or user is not a member
 */
export const getTripById = async (tripId, userId) => {
  try {
    const trip = await Trip.findById(tripId)
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (trip.isDeleted) {
      throw new Error("This trip has been deleted");
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (member) => member._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error("Access denied: You are not a member of this trip");
    }

    return {
      id: trip._id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      destinationType: trip.destinationType,
      owner: trip.owner,
      members: trip.members,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all trips for a user (where user is owner or member)
 * @param {string} userId - User ID
 * @param {Object} options - Filter and search options
 * @param {string} options.filter - Filter by 'upcoming', 'past', or 'all' (default: 'all')
 * @param {string} options.search - Search by trip title (case-insensitive)
 * @param {string} options.sortBy - Sort by 'startDate' or 'endDate' (default: 'startDate')
 * @param {string} options.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Array>} Array of trip objects
 */
export const getUserTrips = async (userId, options = {}) => {
  try {
    const {
      filter = "all",
      search = "",
      sortBy = "startDate",
      sortOrder = "desc",
    } = options;

    // Build query - exclude deleted trips
    const query = { members: userId, isDeleted: false };

    // Apply filter for upcoming/past trips
    const now = new Date();
    if (filter === "upcoming") {
      query.startDate = { $gte: now };
    } else if (filter === "past") {
      query.endDate = { $lt: now };
    }

    // Apply search by title (case-insensitive)
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    // Build sort object
    const sortField = sortBy === "endDate" ? "endDate" : "startDate";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    // Find all trips where user is a member
    const trips = await Trip.find(query)
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort(sort);

    return trips.map((trip) => ({
      id: trip._id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      destinationType: trip.destinationType,
      owner: trip.owner,
      memberCount: trip.members.length,
      members: trip.members,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    }));
  } catch (e) {
    throw e;
  }
};

/**
 * Invite a member to a trip (DEPRECATED - use invitation.service.js)
 * This function is kept for backward compatibility but now uses the invitation system
 * @param {string} tripId - Trip ID
 * @param {string} ownerId - User ID of the trip owner
 * @param {string} email - Email of the user to invite
 * @returns {Promise<Object>} Created invitation
 * @throws {Error} If trip not found, user is not owner, invitee not found, or already a member
 */
export const inviteMember = async (tripId, ownerId, email) => {
  try {
    // Import invitation service to avoid circular dependency
    const { sendInvitation } = await import("#services/invitation.service.js");

    // Use the new invitation system
    const invitation = await sendInvitation(tripId, ownerId, email);

    return invitation;
  } catch (e) {
    throw e;
  }
};

/**
 * Remove a member from a trip
 * @param {string} tripId - Trip ID
 * @param {string} ownerId - User ID of the trip owner
 * @param {string} memberIdToRemove - User ID of the member to remove
 * @returns {Promise<Object>} Updated trip without the removed member
 * @throws {Error} If trip not found, user is not owner, trying to remove self, or member not found
 */
export const removeMember = async (tripId, ownerId, memberIdToRemove) => {
  try {
    // Find the trip
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (trip.isDeleted) {
      throw new Error("This trip has been deleted");
    }

    // Verify ownership
    if (trip.owner.toString() !== ownerId.toString()) {
      throw new Error("Only the trip owner can remove members");
    }

    // Prevent owner from removing themselves
    if (ownerId.toString() === memberIdToRemove.toString()) {
      throw new Error("Trip owner cannot remove themselves from the trip");
    }

    // Check if the user is actually a member
    const memberIndex = trip.members.findIndex(
      (memberId) => memberId.toString() === memberIdToRemove.toString()
    );

    if (memberIndex === -1) {
      throw new Error("User is not a member of this trip");
    }

    // Remove the member
    trip.members.splice(memberIndex, 1);
    await trip.save();

    // Create notification for removed user
    await Notification.create({
      user: memberIdToRemove,
      type: "member_removed",
      title: "Removed from Trip",
      message: `You have been removed from the trip "${trip.title}"`,
      relatedTrip: trip._id,
    });

    // Populate members and owner for response
    await trip.populate("owner", "name email");
    await trip.populate("members", "name email");

    return {
      id: trip._id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      destinationType: trip.destinationType,
      owner: trip.owner,
      members: trip.members,
      updatedAt: trip.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all members of a trip
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the members
 * @returns {Promise<Array>} Array of member objects
 * @throws {Error} If trip not found or user is not a member
 */
export const getTripMembers = async (tripId, userId) => {
  try {
    // Find the trip
    const trip = await Trip.findById(tripId).populate(
      "members",
      "name email verificationStatus"
    );

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (trip.isDeleted) {
      throw new Error("This trip has been deleted");
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (member) => member._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error("Access denied: You are not a member of this trip");
    }

    return trip.members.map((member) => ({
      id: member._id,
      name: member.name,
      email: member.email,
      verificationStatus: member.verificationStatus,
      isOwner: member._id.toString() === trip.owner.toString(),
    }));
  } catch (e) {
    throw e;
  }
};

/**
 * Get all upcoming trips for public exploration (NO AUTH REQUIRED)
 * Returns only non-sensitive data: title, description, dates, destination type, activities, and checklist
 * @returns {Promise<Array>} Array of sanitized trip objects with activities and checklist
 */
export const getPublicUpcomingTrips = async () => {
  try {
    const now = new Date();

    // Import Activity and ChecklistItem models
    const Activity = (await import("#models/activity.model.js")).default;
    const ChecklistItem = (await import("#models/checklist.model.js")).default;

    // Find all upcoming trips that are not deleted
    const trips = await Trip.find({
      startDate: { $gte: now },
      isDeleted: false,
    }).sort({ startDate: 1 });

    // Fetch activities and checklist for each trip
    const tripsWithDetails = await Promise.all(
      trips.map(async (trip) => {
        // Get activities for this trip
        const activities = await Activity.find({ trip: trip._id })
          .select("title description date time location category")
          .sort({ date: 1, time: 1 })
          .limit(10); // Limit to 10 activities per trip

        // Get checklist items for this trip
        const checklistItems = await ChecklistItem.find({ trip: trip._id })
          .select("text isChecked")
          .limit(20); // Limit to 20 items per trip

        return {
          id: trip._id,
          title: trip.title,
          description: trip.description,
          startDate: trip.startDate,
          endDate: trip.endDate,
          destinationType: trip.destinationType,
          tripCategory: trip.tripCategory,
          ownerId: trip.owner.toString(), // Include owner ID for filtering
          members: trip.members.map((m) => m.toString()), // Include member IDs for filtering
          activities: activities.map((act) => ({
            id: act._id,
            title: act.title,
            description: act.description,
            date: act.date,
            time: act.time,
            location: act.location?.name || null,
            category: act.category,
          })),
          checklist: checklistItems.map((item) => ({
            id: item._id,
            text: item.text,
            isChecked: item.isChecked,
          })),
          activityCount: activities.length,
          checklistCount: checklistItems.length,
        };
      })
    );

    return tripsWithDetails;
  } catch (e) {
    throw e;
  }
};
