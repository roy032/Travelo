import { User } from 'lucide-react';

/**
 * Reusable Avatar component
 * Displays user profile image or initials
 */
const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center overflow-hidden bg-linear-to-br from-blue-500 to-purple-600 text-white font-semibold ${className}`}
    >
      {src ? (
        <img src={src} alt={alt || name} className="h-full w-full object-cover" />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 32} />
      )}
    </div>
  );
};

export default Avatar;
