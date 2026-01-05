import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Check,
  X,
  Loader2,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";
import { tripApi, notificationApi } from "../services/api.service";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

/**
 * JoinRequestsPage - Dedicated page for managing all join requests across all trips
 */
const JoinRequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [userTrips, setUserTrips] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAllJoinRequests();
  }, [user]);

  const fetchAllJoinRequests = async () => {
    try {
      setLoading(true);

      // Get all user's trips where they are owner
      const trips = await tripApi.getUserTrips();
      const ownedTrips = trips.filter((trip) => {
        const ownerId = trip.owner?._id || trip.owner?.id || trip.owner;
        return ownerId === user.id;
      });

      setUserTrips(ownedTrips);

      // Fetch join requests for each owned trip
      const allRequests = [];
      for (const trip of ownedTrips) {
        try {
          const tripRequests = await tripApi.getJoinRequests(
            trip.id || trip._id
          );
          // Add trip info to each request
          const requestsWithTrip = tripRequests.map((req) => ({
            ...req,
            relatedTrip: trip,
          }));
          allRequests.push(...requestsWithTrip);
        } catch (err) {
          console.error(`Failed to fetch requests for trip ${trip.id}:`, err);
        }
      }

      setRequests(allRequests);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      toast.error("Failed to load join requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request) => {
    // Extract trip ID properly - it could be nested in relatedTrip object
    const tripId =
      request.relatedTrip?.id ||
      request.relatedTrip?._id ||
      request.relatedTrip;
    const notificationId = request._id;

    if (!tripId) {
      toast.error("Trip information not available");
      return;
    }

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

  const handleReject = async (request) => {
    // Extract trip ID properly - it could be nested in relatedTrip object
    const tripId =
      request.relatedTrip?.id ||
      request.relatedTrip?._id ||
      request.relatedTrip;
    const notificationId = request._id;

    if (!tripId) {
      toast.error("Trip information not available");
      return;
    }

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

  const getTripInfo = (request) => {
    // Trip is now included directly in the request
    return request.relatedTrip;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Loader2 className='w-12 h-12 text-blue-600 animate-spin' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <Users className='w-8 h-8 text-blue-600' />
            <h1 className='text-3xl font-bold text-gray-900'>Join Requests</h1>
          </div>
          <p className='text-gray-600'>Manage join requests for your trips</p>
        </div>

        {/* Empty State */}
        {requests.length === 0 && (
          <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <UserPlus className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              No Pending Requests
            </h2>
            <p className='text-gray-600'>
              You don't have any pending join requests at the moment.
            </p>
          </div>
        )}

        {/* Requests List */}
        {requests.length > 0 && (
          <div className='space-y-4'>
            {requests.map((request) => {
              const tripInfo = getTripInfo(request);
              const requester = request.relatedResource;

              return (
                <div
                  key={request._id}
                  className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
                >
                  <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    {/* Left Section - Request Info */}
                    <div className='flex-1 space-y-3'>
                      {/* Requester Info */}
                      <div className='flex items-start gap-4'>
                        <div className='bg-blue-100 p-3 rounded-full flex-shrink-0'>
                          <UserPlus className='w-6 h-6 text-blue-600' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-lg text-gray-900'>
                            {requester?.name}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            {requester?.email}
                          </p>
                          <p className='text-sm font-medium text-blue-600 mt-1'>
                            {request.message || `Wants to join your trip`}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            Requested{" "}
                            {new Date(request.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Trip Info */}
                      {tripInfo && (
                        <div className='ml-16 pl-4 border-l-2 border-gray-200 space-y-2'>
                          <p className='font-medium text-gray-900'>
                            Trip: {tripInfo.title}
                          </p>
                          <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                            <div className='flex items-center gap-1'>
                              <Calendar className='w-4 h-4' />
                              <span>
                                {new Date(
                                  tripInfo.startDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            {tripInfo.destinationType && (
                              <div className='flex items-center gap-1'>
                                <MapPin className='w-4 h-4' />
                                <span className='capitalize'>
                                  {tripInfo.destinationType}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Section - Actions */}
                    <div className='flex items-center gap-3 lg:flex-col lg:items-stretch'>
                      <button
                        onClick={() => handleAccept(request)}
                        disabled={processingIds.has(request._id)}
                        className='flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors'
                      >
                        {processingIds.has(request._id) ? (
                          <Loader2 className='w-5 h-5 animate-spin' />
                        ) : (
                          <Check className='w-5 h-5' />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        disabled={processingIds.has(request._id)}
                        className='flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors'
                      >
                        {processingIds.has(request._id) ? (
                          <Loader2 className='w-5 h-5 animate-spin' />
                        ) : (
                          <X className='w-5 h-5' />
                        )}
                        Reject
                      </button>
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

export default JoinRequestsPage;
