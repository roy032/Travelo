/**
 * Reusable Input component with validation states and accessibility features
 */
const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const baseStyles = 'block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
  const normalStyles = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500';
  const disabledStyles = 'bg-gray-100 cursor-not-allowed';

  const errorId = error ? `${name}-error` : undefined;
  const describedBy = error ? errorId : ariaDescribedBy;

  return (
    <div className={`${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel || label}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        aria-required={required ? 'true' : 'false'}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${disabled ? disabledStyles : ''}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
