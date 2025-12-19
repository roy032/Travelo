import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { invitationApi } from "../services/api.service";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { format } from "date-fns";

/**
 * PendingInvitationsPage - Shows all pending trip invitations for the user
 */
const PendingInvitationsPage = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationApi.getPendingInvitations();
      setInvitations(response.invitations || []);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    setProcessingId(invitationId);
    try {
      const response = await invitationApi.acceptInvitation(invitationId);

      // Remove from list
      setInvitations(invitations.filter((inv) => inv._id !== invitationId));

      // Navigate to the trip
      if (response.trip) {
        navigate(`/trips/${response.trip._id || response.trip.id}`);
      }
    } catch (error) {
      console.error("Failed to accept invitation:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId) => {
    setProcessingId(invitationId);
    try {
      await invitationApi.rejectInvitation(invitationId);

      // Remove from list
      setInvitations(invitations.filter((inv) => inv._id !== invitationId));
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const getDestinationTypeColor = (type) => {
    const colors = {
      beach: "blue",
      mountain: "green",
      city: "purple",
      countryside: "yellow",
      other: "gray",
    };
    return colors[type] || "gray";
  };

  const getTripCategoryBadge = (category) => {
    const variants = {
      domestic: "success",
      international: "primary",
    };
    return variants[category] || "default";
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2
            size={48}
            className='animate-spin text-primary-600 mx-auto mb-4'
          />
          <p className='text-gray-600'>Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <Mail size={32} className='text-primary-600' />
            <h1 className='text-3xl font-bold text-gray-900'>
              Trip Invitations
            </h1>
          </div>
          <p className='text-gray-600'>
            You have {invitations.length} pending invitation
            {invitations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Invitations List */}
        {invitations.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center'>
            <Mail size={64} className='mx-auto text-gray-300 mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              No pending invitations
            </h3>
            <p className='text-gray-600 mb-6'>
              You don't have any trip invitations at the moment
            </p>
            <Button
              variant='primary'
              onClick={() => navigate("/trips")}
              className='mx-auto'
            >
              Browse Trips
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            {invitations.map((invitation) => (
              <div
                key={invitation._id}
                className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
              >
                {/* Trip Title and Categories */}
                <div className='mb-4'>
                  <div className='flex items-start justify-between mb-2'>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      {invitation.trip.title}
                    </h3>
                    <div className='flex gap-2'>
                      {invitation.trip.destinationType && (
                        <Badge
                          variant={getDestinationTypeColor(
                            invitation.trip.destinationType
                          )}
                        >
                          {invitation.trip.destinationType}
                        </Badge>
                      )}
                      <Badge
                        variant={getTripCategoryBadge(
                          invitation.trip.tripCategory
                        )}
                      >
                        {invitation.trip.tripCategory}
                      </Badge>
                    </div>
                  </div>

                  {invitation.trip.description && (
                    <p className='text-gray-600 text-sm'>
                      {invitation.trip.description}
                    </p>
                  )}
                </div>

                {/* Trip Details */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Calendar size={16} className='text-gray-400' />
                    <span>
                      {format(
                        new Date(invitation.trip.startDate),
                        "MMM d, yyyy"
                      )}{" "}
                      -{" "}
                      {format(new Date(invitation.trip.endDate), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <User size={16} className='text-gray-400' />
                    <span>
                      Invited by{" "}
                      <span className='font-medium text-gray-900'>
                        {invitation.invitedBy.name}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Invitation Time */}
                <div className='mb-4 text-xs text-gray-500'>
                  Invited{" "}
                  {format(
                    new Date(invitation.createdAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3'>
                  <Button
                    variant='primary'
                    onClick={() => handleAccept(invitation._id)}
                    disabled={processingId === invitation._id}
                    loading={processingId === invitation._id}
                    className='flex-1 flex items-center justify-center gap-2'
                  >
                    <CheckCircle size={18} />
                    Accept
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => handleDecline(invitation._id)}
                    disabled={processingId === invitation._id}
                    className='flex-1 flex items-center justify-center gap-2'
                  >
                    <XCircle size={18} />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingInvitationsPage;
