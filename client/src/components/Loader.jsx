/**
 * Reusable Loader component with accessibility features
 */
const Loader = ({
  size = 'md',
  color = 'blue',
  fullScreen = false,
  text,
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colors = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white',
    green: 'border-green-600',
    red: 'border-red-600',
  };

  const loadingText = text || 'Loading';

  const spinner = (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={loadingText}
    >
      <div
        className={`${sizes[size]} animate-spin rounded-full border-b-2 ${colors[color]}`}
        aria-hidden="true"
      ></div>
      {text && <p className="text-sm text-gray-600">{text}</p>}
      {!text && <span className="sr-only">{loadingText}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50"
        role="dialog"
        aria-modal="true"
        aria-label="Loading content"
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;
