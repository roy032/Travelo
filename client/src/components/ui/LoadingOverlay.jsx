import Loader from './Loader';

/**
 * Loading overlay component
 * Displays a full-screen or container-level loading indicator
 */
const LoadingOverlay = ({
  isLoading = false,
  message = 'Loading...',
  fullScreen = false,
  transparent = false,
  children,
}) => {
  if (!isLoading && !children) {
    return null;
  }

  const overlayClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-10';

  const backgroundClasses = transparent
    ? 'bg-white/50 backdrop-blur-sm'
    : 'bg-white/80';

  return (
    <>
      {children}
      {isLoading && (
        <div className={`${overlayClasses} flex items-center justify-center ${backgroundClasses}`}>
          <div className="text-center">
            <Loader size="lg" />
            {message && (
              <p className="mt-4 text-gray-600 font-medium">{message}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LoadingOverlay;
