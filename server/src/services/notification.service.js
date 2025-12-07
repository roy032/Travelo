import Notification from '#models/notification.model.js';

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.user - User ID to receive the notification
 * @param {string} notificationData.type - Type of notification
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} [notificationData.relatedTrip] - Related trip ID (optional)
 * @param {string} [notificationData.relatedResource] - Related resource ID (optional)
 * @returns {Promise<Object>} Created notification object
 * @throws {Error} If validation fails
 */
export const createNotification = async ({
  user,
  type,
  title,
  message,
  relatedTrip,
  relatedResource,
}) => {
  try {
    const notification = new Notification({
      user,
      type,
      title,
      message,
      relatedTrip,
      relatedResource,
    });

    await notification.save();

    return {
      id: notification._id,
      user: notification.user,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedTrip: notification.relatedTrip,
      relatedResource: notification.relatedResource,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get notifications for a user with optional filtering
 * @param {string} userId - User ID
 * @param {Object} [filters] - Optional filters
 * @param {boolean} [filters.isRead] - Filter by read status
 * @param {number} [filters.limit=50] - Maximum number of notifications to return
 * @param {number} [filters.skip=0] - Number of notifications to skip (for pagination)
 * @returns {Promise<Array>} Array of notification objects
 */
export const getUserNotifications = async (
  userId,
  { isRead, limit = 50, skip = 0 } = {}
) => {
  try {
    const query = { user: userId };

    // Add isRead filter if provided
    if (typeof isRead === 'boolean') {
      query.isRead = isRead;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // Reverse chronological order (newest first)
      .limit(limit)
      .skip(skip)
      .populate('relatedTrip', 'title')
      .lean();

    return notifications;
  } catch (e) {
    throw e;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated notification object
 * @throws {Error} If notification not found or user not authorized
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    notification.isRead = true;
    await notification.save();

    return {
      id: notification._id,
      isRead: notification.isRead,
      updatedAt: notification.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result with count of updated notifications
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return {
      modifiedCount: result.modifiedCount,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Result with deletion confirmation
 * @throws {Error} If notification not found or user not authorized
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.deleteOne({
      _id: notificationId,
      user: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error('Notification not found or access denied');
    }

    return {
      deleted: true,
      id: notificationId,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    return count;
  } catch (e) {
    throw e;
  }
};
