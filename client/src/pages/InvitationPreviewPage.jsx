import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Activity as ActivityIcon,
  ListChecks,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { invitationApi } from "../services/api.service";
import Button from "../components/ui/Button";
import { format } from "date-fns";

/**
 * InvitationPreviewPage - Allows invited users to view trip details and accept/reject invitation
 * This page is accessible to invited users who are NOT yet members of the trip
 */
const InvitationPreviewPage = () => {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvitationPreview();
  }, [invitationId]);

  const fetchInvitationPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invitationApi.getInvitationPreview(invitationId);
      setData(response);
    } catch (err) {
      console.error("Failed to fetch invitation preview:", err);
      setError(err.message || "Failed to load invitation details");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const response = await invitationApi.acceptInvitation(invitationId);

      // Navigate to the trip page (user is now a member)
      if (response.trip) {
        navigate(`/trips/${response.trip._id || response.trip.id}`);
      } else {
        navigate("/trips");
      }
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setError(err.message || "Failed to accept invitation");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await invitationApi.rejectInvitation(invitationId);
      navigate("/invitations");
    } catch (err) {
      console.error("Failed to decline invitation:", err);
      setError(err.message || "Failed to decline invitation");
    } finally {
      setProcessing(false);
    }
  };

  const getDurationDays = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const destinationTypeIcons = {
    beach: "🏖️",
    mountain: "⛰️",
    city: "🏙️",
    countryside: "🌾",
    other: "🗺️",
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 text-blue-600 animate-spin mx-auto mb-4' />
          <p className='text-gray-600'>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <XCircle className='w-8 h-8 text-red-600' />
          </div>
          <h2 className='text-xl font-bold text-gray-900 mb-2'>Error</h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <Button onClick={() => navigate("/invitations")} variant='secondary'>
            Back to Invitations
          </Button>
        </div>
      </div>
    );
  }

  if (!data || !data.trip) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <p className='text-gray-600'>No invitation data available</p>
      </div>
    );
  }

  const { invitation, trip } = data;
  const isAlreadyResponded = invitation.status !== "pending";

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <button
          onClick={() => navigate("/invitations")}
          className='flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors'
        >
          <ArrowLeft className='w-5 h-5 mr-2' />
          Back to Invitations
        </button>

        {/* Invitation Card */}
        <div className='bg-white rounded-lg shadow-lg overflow-hidden mb-6'>
          {/* Header */}
          <div className='bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h1 className='text-3xl font-bold mb-2'>Trip Invitation</h1>
                <div className='flex items-center text-blue-100'>
                  <Mail className='w-4 h-4 mr-2' />
                  <span className='text-sm'>
                    Invited by {invitation.invitedBy.name}
                  </span>
                </div>
              </div>
              <span className='text-5xl'>
                {destinationTypeIcons[trip.destinationType] || "🗺️"}
              </span>
            </div>
          </div>

          {/* Trip Details */}
          <div className='p-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              {trip.title}
            </h2>

            {trip.description && (
              <p className='text-gray-600 mb-6 leading-relaxed'>
                {trip.description}
              </p>
            )}

            {/* Trip Info Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
              {/* Dates */}
              <div className='flex items-start space-x-3'>
                <Calendar className='w-5 h-5 text-blue-600 mt-1' />
                <div>
                  <p className='text-sm font-semibold text-gray-900'>Dates</p>
                  <p className='text-sm text-gray-600'>
                    {format(new Date(trip.startDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    {getDurationDays(trip.startDate, trip.endDate)} days
                  </p>
                </div>
              </div>

              {/* Destination Type */}
              <div className='flex items-start space-x-3'>
                <MapPin className='w-5 h-5 text-purple-600 mt-1' />
                <div>
                  <p className='text-sm font-semibold text-gray-900'>
                    Destination
                  </p>
                  <p className='text-sm text-gray-600 capitalize'>
                    {trip.destinationType || "Not specified"}
                  </p>
                  <p className='text-xs text-gray-500 mt-1 capitalize'>
                    {trip.tripCategory || "domestic"}
                  </p>
                </div>
              </div>

              {/* Members */}
              <div className='flex items-start space-x-3'>
                <Users className='w-5 h-5 text-green-600 mt-1' />
                <div>
                  <p className='text-sm font-semibold text-gray-900'>
                    Current Members
                  </p>
                  <p className='text-sm text-gray-600'>
                    {trip.memberCount}{" "}
                    {trip.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>

              {/* Activities */}
              <div className='flex items-start space-x-3'>
                <ActivityIcon className='w-5 h-5 text-orange-600 mt-1' />
                <div>
                  <p className='text-sm font-semibold text-gray-900'>
                    Planned Activities
                  </p>
                  <p className='text-sm text-gray-600'>
                    {trip.activityCount}{" "}
                    {trip.activityCount === 1 ? "activity" : "activities"}
                  </p>
                </div>
              </div>
            </div>

            {/* Activities Preview */}
            {trip.activities && trip.activities.length > 0 && (
              <div className='mb-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <ActivityIcon className='w-5 h-5 mr-2 text-orange-600' />
                  Sample Activities
                </h3>
                <div className='space-y-3'>
                  {trip.activities.map((activity, index) => (
                    <div
                      key={index}
                      className='bg-gray-50 rounded-md p-4 hover:bg-gray-100 transition-colors'
                    >
                      <h4 className='font-semibold text-gray-900 mb-2'>
                        {activity.title}
                      </h4>
                      <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                        <span className='flex items-center'>
                          <Calendar className='w-4 h-4 mr-1' />
                          {format(new Date(activity.date), "MMM d, yyyy")}
                        </span>
                        <span className='flex items-center'>
                          <Clock className='w-4 h-4 mr-1' />
                          {activity.time}
                        </span>
                        {activity.location && (
                          <span className='flex items-center'>
                            <MapPin className='w-4 h-4 mr-1' />
                            {activity.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {trip.activityCount > trip.activities.length && (
                  <p className='text-sm text-gray-500 mt-3 text-center'>
                    + {trip.activityCount - trip.activities.length} more{" "}
                    {trip.activityCount - trip.activities.length === 1
                      ? "activity"
                      : "activities"}
                  </p>
                )}
              </div>
            )}

            {/* Checklist Info */}
            {trip.checklistCount > 0 && (
              <div className='bg-blue-50 rounded-md p-4 mb-8'>
                <div className='flex items-center text-blue-900'>
                  <ListChecks className='w-5 h-5 mr-2' />
                  <span className='font-semibold'>
                    {trip.checklistCount} checklist{" "}
                    {trip.checklistCount === 1 ? "item" : "items"} prepared
                  </span>
                </div>
              </div>
            )}

            {/* Already Responded Message */}
            {isAlreadyResponded && (
              <div
                className={`rounded-md p-4 mb-6 ${
                  invitation.status === "accepted"
                    ? "bg-green-50 text-green-900"
                    : invitation.status === "rejected"
                    ? "bg-red-50 text-red-900"
                    : "bg-gray-50 text-gray-900"
                }`}
              >
                <p className='font-semibold'>
                  You have already {invitation.status} this invitation
                </p>
                {invitation.respondedAt && (
                  <p className='text-sm mt-1'>
                    {format(
                      new Date(invitation.respondedAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isAlreadyResponded && (
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button
                  onClick={handleAccept}
                  disabled={processing}
                  className='flex-1 bg-green-600 hover:bg-green-700'
                >
                  {processing ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className='w-4 h-4 mr-2' />
                      Accept Invitation
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={processing}
                  variant='secondary'
                  className='flex-1'
                >
                  {processing ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className='w-4 h-4 mr-2' />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationPreviewPage;
