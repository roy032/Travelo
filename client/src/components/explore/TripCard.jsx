import PropTypes from "prop-types";
import {
  Calendar,
  MapPin,
  ListChecks,
  Activity,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { tripApi } from "../../services/api.service";
import toast from "react-hot-toast";
import ReportButton from "../report/ReportButton";

/**
 * TripCard - Displays a single trip in the public explore view
 * Shows only non-sensitive information: title, dates, destination, activities preview, and checklist preview
 */
const TripCard = ({ trip }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const handleJoinRequest = async () => {
    if (!user) {
      toast.error("Please log in to request to join this trip");
      navigate("/login");
      return;
    }

    try {
      setRequesting(true);
      await tripApi.requestToJoin(trip.id, user.id);
    } catch (error) {
      // Error handling is done in api.service.js
      console.error("Join request error:", error);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-2xl font-bold mb-2'>{trip.title}</h3>
            {trip.description && (
              <p className='text-blue-50 text-sm line-clamp-2'>
                {trip.description}
              </p>
            )}
          </div>
          <span className='text-4xl ml-4'>
            {destinationTypeIcons[trip.destinationType] || "🗺️"}
          </span>
        </div>
      </div>

      {/* Trip Details */}
      <div className='p-6 space-y-4'>
        {/* Date Information */}
        <div className='flex items-center space-x-3 text-gray-700'>
          <Calendar className='w-5 h-5 text-blue-500' />
          <div className='text-sm'>
            <span className='font-semibold'>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
            <span className='text-gray-500 ml-2'>
              ({getDurationDays(trip.startDate, trip.endDate)} days)
            </span>
          </div>
        </div>

        {/* Destination Type */}
        <div className='flex items-center space-x-3 text-gray-700'>
          <MapPin className='w-5 h-5 text-purple-500' />
          <div className='text-sm'>
            <span className='font-semibold capitalize'>
              {trip.destinationType || "Unknown"}
            </span>
            <span className='text-gray-500 ml-2'>
              ({trip.tripCategory || "domestic"})
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className='flex items-center space-x-6 pt-2 border-t border-gray-200'>
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <Activity className='w-4 h-4 text-green-500' />
            <span>
              {trip.activityCount}{" "}
              {trip.activityCount === 1 ? "activity" : "activities"}
            </span>
          </div>
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <ListChecks className='w-4 h-4 text-orange-500' />
            <span>
              {trip.checklistCount}{" "}
              {trip.checklistCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        {/* Join Request Button */}
        <div className='pt-4 border-t border-gray-200 space-y-2'>
          <button
            onClick={handleJoinRequest}
            disabled={requesting}
            className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2'
          >
            {requesting ? (
              <>
                <Loader2 className='w-5 h-5 animate-spin' />
                <span>Sending Request...</span>
              </>
            ) : (
              <>
                <UserPlus className='w-5 h-5' />
                <span>{user ? "Request to Join" : "Log in to Join"}</span>
              </>
            )}
          </button>

          {/* Report Button */}
          <div className='flex justify-center'>
            <ReportButton
              tripId={trip.id}
              tripTitle={trip.title}
              variant='ghost'
              size='sm'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

TripCard.propTypes = {
  trip: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    destinationType: PropTypes.string,
    tripCategory: PropTypes.string,
    activities: PropTypes.array,
    checklist: PropTypes.array,
    activityCount: PropTypes.number,
    checklistCount: PropTypes.number,
  }).isRequired,
};

export default TripCard;
