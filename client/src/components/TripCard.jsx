import { Calendar, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import Badge from "./Badge";

/**
 * TripCard component - displays trip summary information
 */
const TripCard = ({ trip }) => {
  const navigate = useNavigate();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTripStatus = () => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (now < startDate) {
      return { label: "Upcoming", variant: "info" };
    } else if (now > endDate) {
      return { label: "Past", variant: "secondary" };
    } else {
      return { label: "Ongoing", variant: "success" };
    }
  };

  const status = getTripStatus();

  const handleClick = () => {
    navigate(`/trips/${trip.id}`);
  };

  return (
    <Card hover onClick={handleClick} className='h-full'>
      {/* <div>{JSON.stringify(trip)}</div> */}
      <div className='flex flex-col h-full'>
        {/* Header */}
        <div className='flex items-start justify-between mb-3'>
          <h3 className='text-lg font-semibold text-gray-900 line-clamp-2 flex-1'>
            {trip.title}
          </h3>
          <Badge variant={status.variant} className='ml-2 shrink-0'>
            {status.label}
          </Badge>
        </div>

        {/* Description */}
        {trip.description && (
          <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
            {trip.description}
          </p>
        )}

        {/* Trip Details */}
        <div className='space-y-2 mt-auto'>
          {/* Dates */}
          <div className='flex items-center text-sm text-gray-600'>
            <Calendar size={16} className='mr-2 shrink-0' />
            <span>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
          </div>

          {/* Destination Type */}
          {trip.destinationType && (
            <div className='flex items-center text-sm text-gray-600'>
              <MapPin size={16} className='mr-2 shrink-0' />
              <span className='capitalize'>{trip.destinationType}</span>
            </div>
          )}

          {/* Members */}
          <div className='flex items-center text-sm text-gray-600'>
            <Users size={16} className='mr-2 shrink-0' />
            <span>
              {trip.members?.length || 0}{" "}
              {trip.members?.length === 1 ? "member" : "members"}
            </span>
          </div>
        </div>

        {/* Owner Badge */}
        {trip.isOwner && (
          <div className='mt-3 pt-3 border-t border-gray-200'>
            <Badge variant='primary' size='sm'>
              Owner
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TripCard;
