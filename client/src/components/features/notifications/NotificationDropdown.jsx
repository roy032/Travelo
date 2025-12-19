import { useState, useEffect, useRef } from "react";
import { X, CheckCheck, Trash2 } from "lucide-react";
import { notificationApi } from "../../../services/api.service";
import NotificationItem from "./NotificationItem";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";

/**
 * NotificationDropdown component
 * Displays a dropdown list of recent notifications
 */
const NotificationDropdown = ({
  onClose,
  onNotificationRead,
  onMarkAllAsRead,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications({ limit: 10 });
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);

      // Update local state
      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );

      onNotificationRead();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);

      // Remove from local state
      setNotifications(notifications.filter((n) => n._id !== notificationId));

      onNotificationRead();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      await notificationApi.markAllAsRead();

      // Update all notifications to read
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));

      onMarkAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div
      ref={dropdownRef}
      className='absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col'
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <h3 className='text-lg font-semibold text-gray-900'>Notifications</h3>
        <div className='flex items-center gap-2'>
          {hasUnread && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllAsRead}
              className='text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50'
              title='Mark all as read'
            >
              <CheckCheck size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            aria-label='Close'
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className='overflow-y-auto flex-1'>
        {loading ? (
          <div className='flex items-center justify-center p-8'>
            <Loader />
          </div>
        ) : notifications.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100'>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className='p-3 border-t border-gray-200 text-center'>
          <a
            href='/notifications'
            className='text-sm text-blue-600 hover:text-blue-700 font-medium'
            onClick={onClose}
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
