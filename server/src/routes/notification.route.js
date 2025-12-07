import express from 'express';
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  getUnreadCountController,
} from '#controllers/notification.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get all notifications for the authenticated user with pagination
router.get('/notifications', getNotificationsController);

// Get unread notification count
router.get('/notifications/unread-count', getUnreadCountController);

// Mark a notification as read
router.patch('/notifications/:notificationId/read', markAsReadController);

// Mark all notifications as read
router.patch('/notifications/read-all', markAllAsReadController);

// Delete a notification
router.delete('/notifications/:notificationId', deleteNotificationController);

export default router;
