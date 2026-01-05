/**
 * Skeleton loader components for displaying loading states
 * Provides visual feedback while content is being fetched
 */

/**
 * Base skeleton component with animation
 */
export const Skeleton = ({ className = '', width, height }) => {
  const style = {
    width: width || '100%',
    height: height || '1rem',
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  );
};

/**
 * Skeleton for text lines
 */
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="0.75rem"
          width={index === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for card components
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <Skeleton height="1.5rem" width="60%" className="mb-4" />
      <SkeletonText lines={3} />
      <div className="mt-4 flex gap-2">
        <Skeleton height="2rem" width="5rem" />
        <Skeleton height="2rem" width="5rem" />
      </div>
    </div>
  );
};

/**
 * Skeleton for list items
 */
export const SkeletonListItem = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-lg ${className}`}>
      <Skeleton width="3rem" height="3rem" className="rounded-full shrink-0" />
      <div className="flex-1">
        <Skeleton height="1rem" width="40%" className="mb-2" />
        <Skeleton height="0.75rem" width="60%" />
      </div>
    </div>
  );
};

/**
 * Skeleton for table rows
 */
export const SkeletonTableRow = ({ columns = 4, className = '' }) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton height="1rem" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton for avatar/profile image
 */
export const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <Skeleton
      className={`rounded-full ${sizeClasses[size]} ${className}`}
    />
  );
};

/**
 * Skeleton for image placeholders
 */
export const SkeletonImage = ({ aspectRatio = '16/9', className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ aspectRatio }}
    >
      <Skeleton className="absolute inset-0" />
    </div>
  );
};

/**
 * Skeleton for trip card grid
 */
export const SkeletonTripGrid = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

/**
 * Skeleton for list view
 */
export const SkeletonList = ({ count = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonListItem key={index} />
      ))}
    </div>
  );
};

/**
 * Skeleton for form inputs
 */
export const SkeletonForm = ({ fields = 4, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton height="1rem" width="30%" className="mb-2" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
      <Skeleton height="2.5rem" width="8rem" className="mt-6" />
    </div>
  );
};

export default Skeleton;
