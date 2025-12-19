import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { UserPlus, Check, X, Loader2, Users } from "lucide-react";
import { tripApi } from "../../services/api.service";

/**
 * JoinRequestsPanel - Shows pending join requests for trip owners
 */
const JoinRequestsPanel = ({ tripId, isOwner }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    if (isOwner) {
      fetchJoinRequests();
    }
  }, [tripId, isOwner]);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const data = await tripApi.getJoinRequests(tripId);
      setRequests(data);
    } catch (error) {
      console.error("Error fetching join requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (notificationId) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(notificationId));
      await tripApi.acceptJoinRequest(tripId, notificationId);
      // Remove from list after successful acceptance
      setRequests((prev) => prev.filter((req) => req._id !== notificationId));
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleReject = async (notificationId) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(notificationId));
      await tripApi.rejectJoinRequest(tripId, notificationId);
      // Remove from list after successful rejection
      setRequests((prev) => prev.filter((req) => req._id !== notificationId));
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Don't render if not owner or no requests
  if (!isOwner || (requests.length === 0 && !loading)) {
    return null;
  }

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-8 h-8 text-blue-600 animate-spin' />
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <Users className='w-6 h-6 text-blue-600' />
        <h2 className='text-2xl font-bold text-gray-900'>
          Join Requests ({requests.length})
        </h2>
      </div>

      <div className='space-y-4'>
        {requests.map((request) => (
          <div
            key={request._id}
            className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'
          >
            <div className='flex items-center gap-4'>
              <div className='bg-blue-100 p-3 rounded-full'>
                <UserPlus className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <p className='font-semibold text-gray-900'>
                  {request.relatedResource?.firstName}{" "}
                  {request.relatedResource?.lastName}
                </p>
                <p className='text-sm text-gray-600'>
                  {request.relatedResource?.email}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  {new Date(request.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={() => handleAccept(request._id)}
                disabled={processingIds.has(request._id)}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors'
              >
                {processingIds.has(request._id) ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Check className='w-4 h-4' />
                )}
                Accept
              </button>
              <button
                onClick={() => handleReject(request._id)}
                disabled={processingIds.has(request._id)}
                className='flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors'
              >
                {processingIds.has(request._id) ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <X className='w-4 h-4' />
                )}
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

JoinRequestsPanel.propTypes = {
  tripId: PropTypes.string.isRequired,
  isOwner: PropTypes.bool.isRequired,
};

export default JoinRequestsPanel;
