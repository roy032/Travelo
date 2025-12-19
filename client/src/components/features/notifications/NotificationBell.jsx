import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { notificationApi } from "../../../services/api.service";
import NotificationDropdown from "./NotificationDropdown";
import toast from "react-hot-toast";

/**
 * NotificationBell component with unread badge
 * Displays notification icon with unread count and dropdown
 * Polls for new notifications every 30 seconds
 */
const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNotificationRead = () => {
    // Refresh unread count when a notification is marked as read
    fetchUnreadCount();
  };

  const handleMarkAllAsRead = () => {
    // Refresh unread count when all notifications are marked as read
    setUnreadCount(0);
  };

  return (
    <div className='relative'>
      <button
        onClick={toggleDropdown}
        className='relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
        aria-label='Notifications'
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className='absolute top-2 right-2 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full'>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <NotificationDropdown
          onClose={() => setIsDropdownOpen(false)}
          onNotificationRead={handleNotificationRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </div>
  );
};

export default NotificationBell;
