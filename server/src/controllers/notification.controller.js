import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from '#services/notification.service.js';

/**
 * Get notifications for the authenticated user with pagination
 */
export const getNotificationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isRead, limit, skip, page } = req.query;

    // Parse pagination parameters
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedSkip = skip ? parseInt(skip, 10) : 0;

    // Alternative pagination using page number
    const parsedPage = page ? parseInt(page, 10) : null;
    const finalSkip = parsedPage ? (parsedPage - 1) * parsedLimit : parsedSkip;

    // Parse isRead filter
    let isReadFilter;
    if (isRead === 'true') {
      isReadFilter = true;
    } else if (isRead === 'false') {
      isReadFilter = false;
    }

    const notifications = await getUserNotifications(userId, {
      isRead: isReadFilter,
      limit: parsedLimit,
      skip: finalSkip,
    });

    res.status(200).json({
      notifications,
      count: notifications.length,
      pagination: {
        limit: parsedLimit,
        skip: finalSkip,
        page: parsedPage || Math.floor(finalSkip / parsedLimit) + 1,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Mark a notification as read
 */
export const markAsReadController = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await markAsRead(notificationId, userId);

    res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (e) {
    if (e.message === 'Notification not found or access denied') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Notification not found or access denied',
      });
    }

    next(e);
  }
};

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllAsReadController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await markAllAsRead(userId);

    res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete a notification
 */
export const deleteNotificationController = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await deleteNotification(notificationId, userId);

    res.status(200).json({
      message: 'Notification deleted successfully',
      ...result,
    });
  } catch (e) {
    if (e.message === 'Notification not found or access denied') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Notification not found or access denied',
      });
    }

    next(e);
  }
};

/**
 * Get unread notification count for the authenticated user
 */
export const getUnreadCountController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await getUnreadCount(userId);

    res.status(200).json({
      unreadCount: count,
    });
  } catch (e) {
    next(e);
  }
};
