import { useCallback } from "react";
import PropTypes from "prop-types";
import Loader from "../../ui/Loader";
import ItineraryMap from "./ItineraryMap";
import { activityApi } from "../../../services/api.service";
import { useAsyncData } from "../../../hooks/useAsyncData";

/**
 * MapView component - the trip's itinerary on a map, for members
 */
const MapView = ({ tripId, tripStartDate }) => {
  const load = useCallback(() => activityApi.getActivities(tripId), [tripId]);
  const { data: activities, error, loading } = useAsyncData(load);

  if (loading) {
    return (
      <div className='flex justify-center py-12'>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <p className='text-center py-12 text-gray-600'>
        The map couldn&apos;t be loaded. Please try again.
      </p>
    );
  }

  return (
    <div>
      <div className='mb-4'>
        <h2 className='text-2xl font-bold text-gray-900'>Map View</h2>
        <p className='text-gray-600 mt-1'>
          {activities.length} {activities.length === 1 ? "stop" : "stops"} in
          visiting order
        </p>
      </div>
      <ItineraryMap activities={activities} tripStartDate={tripStartDate} />
    </div>
  );
};

MapView.propTypes = {
  tripId: PropTypes.string.isRequired,
  tripStartDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
};

export default MapView;
