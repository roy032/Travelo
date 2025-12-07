import { MapPin, Clock, Edit2, Trash2 } from 'lucide-react';
import Button from './Button';
import Card from './Card';

/**
 * ActivityCard component - displays a single activity with edit/delete actions
 */
const ActivityCard = ({ activity, onEdit, onDelete, canEdit = true }) => {
  const formatTime = (time) => {
    if (!time) return '';
    // Handle both HH:MM and full date formats
    if (time.includes(':')) {
      return time;
    }
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {activity.title}
          </h4>

          {activity.description && (
            <p className="text-gray-600 mb-3 text-sm">
              {activity.description}
            </p>
          )}

          <div className="flex flex-col space-y-1 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>{formatTime(activity.time)}</span>
            </div>

            {activity.location && (
              <div className="flex items-center">
                <MapPin size={16} className="mr-2" />
                <span>{activity.location.name || activity.location}</span>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(activity)}
              className="text-blue-600 hover:text-blue-800 transition-colors p-1"
              aria-label="Edit activity"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => onDelete(activity._id)}
              className="text-red-600 hover:text-red-800 transition-colors p-1"
              aria-label="Delete activity"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityCard;
