import { formatDistanceToNow } from "date-fns";
import { Trash2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * NotificationItem component
 * Displays individual notification with actions
 */
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }

    // Navigate to related resource if available
    // For trip invitations, go to invitation preview page
    if (notification.type === "trip_invite" && notification.relatedResource) {
      navigate(`/invitations/${notification.relatedResource}`);
    } else if (notification.type === "join_request") {
      // For join requests, go to join requests page
      navigate("/join-requests");
    } else if (notification.relatedTrip) {
      navigate(
        `/trips/${notification.relatedTrip._id || notification.relatedTrip}`
      );
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      trip_invite: "🎒",
      join_request: "👥",
      member_removed: "👋",
      expense_added: "💰",
      message_sent: "💬",
      activity_added: "📅",
      verification_approved: "✅",
      verification_rejected: "❌",
      photo_uploaded: "📸",
      document_uploaded: "📄",
      note_shared: "📝",
      checklist_updated: "✓",
    };
    return iconMap[type] || "🔔";
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={`relative p-4 hover:bg-gray-50 cursor-pointer transition-colors focus-within:bg-gray-50 dark:hover:bg-gray-800 dark:focus-within:bg-gray-800 ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-950/40" : ""
      }`}
    >
      <div className='flex items-start gap-3'>
        {/* Icon */}
        <div className='shrink-0 text-2xl' aria-hidden='true'>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1'>
              {/* The whole row is clickable through this button */}
              <button
                type='button'
                onClick={handleClick}
                className='text-left text-sm font-semibold text-gray-900 mb-1 focus:outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-500 dark:text-gray-100'
              >
                {!notification.isRead && <span className='sr-only'>Unread: </span>}
                {notification.title}
              </button>
              <p className='text-sm text-gray-600 line-clamp-2 dark:text-gray-400'>
                {notification.message}
              </p>
              <p className='text-xs text-gray-500 mt-1 dark:text-gray-400'>{timeAgo}</p>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2'>
              {!notification.isRead && (
                <Circle size={8} className='text-blue-600 fill-current dark:text-blue-400' aria-hidden='true' />
              )}
              <button
                onClick={handleDelete}
                className='relative z-10 p-1 rounded text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:text-red-400'
                aria-label={`Delete notification: ${notification.title}`}
              >
                <Trash2 size={16} aria-hidden='true' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
