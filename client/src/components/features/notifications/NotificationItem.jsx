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
      onClick={handleClick}
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? "bg-blue-50" : ""
      }`}
    >
      <div className='flex items-start gap-3'>
        {/* Icon */}
        <div className='shrink-0 text-2xl'>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1'>
              <p className='text-sm font-semibold text-gray-900 mb-1'>
                {notification.title}
              </p>
              <p className='text-sm text-gray-600 line-clamp-2'>
                {notification.message}
              </p>
              <p className='text-xs text-gray-500 mt-1'>{timeAgo}</p>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2'>
              {!notification.isRead && (
                <Circle size={8} className='text-blue-600 fill-current' />
              )}
              <button
                onClick={handleDelete}
                className='text-gray-400 hover:text-red-600 transition-colors'
                aria-label='Delete notification'
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
