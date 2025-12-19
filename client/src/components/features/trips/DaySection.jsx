import ActivityCard from "./ActivityCard";

/**
 * DaySection component - groups activities by date
 */
const DaySection = ({
  date,
  activities,
  onEditActivity,
  onDeleteActivity,
  canEdit,
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getDay = (dateString) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  return (
    <div className='mb-8'>
      {/* Date Header */}
      <div className='flex items-center mb-4'>
        <div className='flex flex-col items-center justify-center bg-blue-600 text-white rounded-lg p-3 mr-4 min-w-[60px]'>
          <span className='text-xs font-medium uppercase'>
            {getDayOfWeek(date)}
          </span>
          <span className='text-2xl font-bold'>{getDay(date)}</span>
        </div>
        <div>
          <h3 className='text-xl font-semibold text-gray-900'>
            {formatDate(date)}
          </h3>
          <p className='text-sm text-gray-500'>
            {activities.length}{" "}
            {activities.length === 1 ? "activity" : "activities"}
          </p>
        </div>
      </div>

      {/* Activities List */}
      <div className='ml-[76px] space-y-3'>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onEdit={onEditActivity}
            onDelete={onDeleteActivity}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default DaySection;
