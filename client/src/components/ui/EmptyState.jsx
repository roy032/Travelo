import Button from './Button';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Empty state component with accessibility features
 * Displays a message when there's no data to show
 */
const EmptyState = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-12 px-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className="mb-4 flex justify-center" aria-hidden="true">
          {typeof icon === 'string' ? (
            <div className="text-6xl">{icon}</div>
          ) : (
            icon
          )}
        </div>
      )}

      {title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-2 dark:text-gray-100">
          {title}
        </h3>
      )}

      {message && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto dark:text-gray-400">
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} aria-label={actionLabel}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

/**
 * Predefined empty states for common scenarios
 */
export const EmptyTrips = ({ onCreateTrip }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="🗺️"
      title={t("trips.emptyTitle")}
      message={t("trips.emptyMessage")}
      actionLabel={t("trips.create")}
      onAction={onCreateTrip}
    />
  );
};

export const EmptyActivities = ({ onAddActivity }) => (
  <EmptyState
    icon="📅"
    title="No activities planned"
    message="Add activities to your itinerary to organize your trip schedule."
    actionLabel="Add Activity"
    onAction={onAddActivity}
  />
);

export const EmptyExpenses = ({ onAddExpense }) => (
  <EmptyState
    icon="💰"
    title="No expenses recorded"
    message="Start tracking your trip expenses to manage your budget."
    actionLabel="Add Expense"
    onAction={onAddExpense}
  />
);

export const EmptyNotes = ({ onCreateNote }) => (
  <EmptyState
    icon="📝"
    title="No notes yet"
    message="Create notes to capture ideas and important information about your trip."
    actionLabel="Create Note"
    onAction={onCreateNote}
  />
);

export const EmptyPhotos = ({ onUploadPhoto }) => (
  <EmptyState
    icon="📸"
    title="No photos yet"
    message="Upload photos to share memories with your travel companions."
    actionLabel="Upload Photo"
    onAction={onUploadPhoto}
  />
);

export const EmptyChecklist = ({ onAddItem }) => (
  <EmptyState
    icon="✅"
    title="No checklist items"
    message="Add items to your checklist to keep track of tasks and packing needs."
    actionLabel="Add Item"
    onAction={onAddItem}
  />
);

export const EmptyNotifications = () => (
  <EmptyState
    icon="🔔"
    title="No notifications"
    message="You're all caught up! You'll see notifications here when there's activity on your trips."
  />
);

export const EmptySearchResults = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="🔍"
      title={t("trips.noResultsTitle")}
      message={t("trips.noResultsMessage")}
    />
  );
};

export default EmptyState;
