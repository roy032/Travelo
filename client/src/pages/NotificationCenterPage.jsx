import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, CheckCircle, XCircle } from "lucide-react";
import { notificationApi, invitationApi } from "../services/api.service";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import Badge from "../components/ui/Badge";
import { formatDistanceToNow } from "date-fns";

/**
 * NotificationCenter page
 * Full page view of all notifications with filtering
 */
const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filter === "unread") {
        params.isRead = "false";
      } else if (filter === "read") {
        params.isRead = "true";
      }

      const response = await notificationApi.getNotifications(params);
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
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);

      // Remove from local state
      setNotifications(notifications.filter((n) => n._id !== notificationId));
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
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate to invitation preview for trip invitations
    if (notification.type === "trip_invite" && notification.relatedResource) {
      navigate(`/invitations/${notification.relatedResource}`);
    } else if (notification.relatedTrip) {
      // Navigate to trip for other notifications
      navigate(
        `/trips/${notification.relatedTrip._id || notification.relatedTrip}`
      );
    }
  };

  const handleAcceptInvitation = async (notification, e) => {
    e.stopPropagation();

    if (!notification.relatedResource) {
      console.error("No invitation ID found");
      return;
    }

    setProcessingInvitation(notification._id);
    try {
      const response = await invitationApi.acceptInvitation(
        notification.relatedResource
      );

      // Remove notification from list
      setNotifications(notifications.filter((n) => n._id !== notification._id));

      // Navigate to the trip
      if (response.trip) {
        navigate(`/trips/${response.trip._id || response.trip.id}`);
      }
    } catch (error) {
      console.error("Failed to accept invitation:", error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (notification, e) => {
    e.stopPropagation();

    if (!notification.relatedResource) {
      console.error("No invitation ID found");
      return;
    }

    setProcessingInvitation(notification._id);
    try {
      await invitationApi.rejectInvitation(notification.relatedResource);

      // Remove notification from list
      setNotifications(notifications.filter((n) => n._id !== notification._id));
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      trip_invite: "🎒",
      trip_invite_sent: "✉️",
      trip_invite_accepted: "🎉",
      trip_invite_rejected: "📭",
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-4xl mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Bell size={32} className='text-blue-600' />
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className='text-sm text-gray-600 mt-1'>
                    {unreadCount} unread notification
                    {unreadCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleMarkAllAsRead}
                loading={markingAllAsRead}
              >
                <CheckCheck size={16} className='mr-2' />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className='flex gap-2 mt-6'>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "unread"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant='primary' size='sm' className='ml-2'>
                  {unreadCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "read"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Read
            </button>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className='max-w-4xl mx-auto px-4 py-6'>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader />
          </div>
        ) : notifications.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
            <Bell size={48} className='mx-auto text-gray-400 mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              No notifications
            </h3>
            <p className='text-gray-600'>
              {filter === "unread"
                ? "You're all caught up!"
                : filter === "read"
                ? "No read notifications yet"
                : "You have no notifications yet"}
            </p>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-sm divide-y divide-gray-100'>
            {notifications.map((notification) => {
              const timeAgo = formatDistanceToNow(
                new Date(notification.createdAt),
                {
                  addSuffix: true,
                }
              );

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 ${
                    notification.type !== "trip_invite" ? "cursor-pointer" : ""
                  } transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className='flex items-start gap-4'>
                    {/* Icon */}
                    <div className='shrink-0 text-3xl'>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='text-base font-semibold text-gray-900'>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <Badge variant='primary' size='sm'>
                                New
                              </Badge>
                            )}
                          </div>
                          <p className='text-sm text-gray-600 mb-2'>
                            {notification.message}
                          </p>
                          <p className='text-xs text-gray-500'>{timeAgo}</p>

                          {/* Invitation Actions */}
                          {notification.type === "trip_invite" && (
                            <div className='flex gap-2 mt-3'>
                              <Button
                                variant='primary'
                                size='sm'
                                onClick={(e) =>
                                  handleAcceptInvitation(notification, e)
                                }
                                disabled={
                                  processingInvitation === notification._id
                                }
                                loading={
                                  processingInvitation === notification._id
                                }
                                className='flex items-center gap-1'
                              >
                                <CheckCircle size={14} />
                                Accept
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) =>
                                  handleDeclineInvitation(notification, e)
                                }
                                disabled={
                                  processingInvitation === notification._id
                                }
                                className='flex items-center gap-1'
                              >
                                <XCircle size={14} />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                          className='text-gray-400 hover:text-red-600 transition-colors'
                          aria-label='Delete notification'
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
