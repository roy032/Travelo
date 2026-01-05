import Button from './Button';
import Loader from './Loader';

/**
 * Button component with loading state
 * Automatically disables and shows loading indicator when isLoading is true
 */
const LoadingButton = ({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  disabled = false,
  variant = 'primary',
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  return (
    <Button
      type={type}
      variant={variant}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`relative ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader size="sm" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;
