import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import DaySection from "./DaySection";
import Button from "./Button";
import Loader from "./Loader";
import { SkeletonList } from "./SkeletonLoader";
import { EmptyActivities } from "./EmptyState";
import { activityApi } from "../services/api.service";
import toast from "react-hot-toast";
import { successMessages } from "../utils/toast.config";

/**
 * ItineraryView component - displays activities organized by day
 */
const ItineraryView = ({
  tripId,
  tripStartDate,
  tripEndDate,
  onAddActivity,
  canEdit = true,
  refreshKey = 0,
}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedActivities, setGroupedActivities] = useState({});

  useEffect(() => {
    fetchActivities();
  }, [tripId, refreshKey]);

  useEffect(() => {
    // Group activities by date
    const grouped = activities.reduce((acc, activity) => {
      const date = new Date(activity.date).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    // Sort activities within each day by time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        const timeA = a.time || "00:00";
        const timeB = b.time || "00:00";
        return timeA.localeCompare(timeB);
      });
    });

    setGroupedActivities(grouped);
  }, [activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await activityApi.getActivities(tripId);
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const handleEditActivity = (activity) => {
    onAddActivity(activity);
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      await activityApi.deleteActivity(tripId, activityId);
      setActivities(activities.filter((a) => a._id !== activityId));
      toast.success(successMessages.deleted);
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  const handleActivityCreated = (newActivity) => {
    setActivities([...activities, newActivity]);
  };

  const handleActivityUpdated = (updatedActivity) => {
    setActivities(
      activities.map((a) =>
        a._id === updatedActivity._id ? updatedActivity : a
      )
    );
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <div className='h-8 w-32 bg-gray-200 rounded animate-pulse'></div>
            <div className='h-4 w-48 bg-gray-200 rounded animate-pulse mt-2'></div>
          </div>
          <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  // Get sorted dates
  const sortedDates = Object.keys(groupedActivities).sort();

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Itinerary</h2>
          <p className='text-gray-600 mt-1'>
            {activities.length}{" "}
            {activities.length === 1 ? "activity" : "activities"} planned
          </p>
        </div>
        {canEdit && (
          <Button
            variant='primary'
            onClick={() => onAddActivity(null)}
            className='flex items-center'
          >
            <Plus size={20} className='mr-2' />
            Add Activity
          </Button>
        )}
      </div>

      {activities.length === 0 ? (
        <EmptyActivities
          onAddActivity={canEdit ? () => onAddActivity(null) : undefined}
        />
      ) : (
        <div className='space-y-8'>
          {sortedDates.map((date, index) => (
            <DaySection
              key={index}
              date={date}
              activities={groupedActivities[date]}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ItineraryView;
