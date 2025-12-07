import { Lock, Users } from 'lucide-react';

/**
 * VisibilityToggle component - toggle between private and shared visibility
 */
const VisibilityToggle = ({ visibility, onChange, disabled = false }) => {
  const isPrivate = visibility === 'private';

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">Visibility:</label>
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onChange('private')}
          disabled={disabled}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isPrivate
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Lock size={14} />
          <span>Private</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('shared')}
          disabled={disabled}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!isPrivate
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Users size={14} />
          <span>Shared</span>
        </button>
      </div>
    </div>
  );
};

export default VisibilityToggle;
