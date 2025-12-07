/**
 * Toast notification configuration
 * Provides consistent styling and behavior for toast notifications
 */

export const toastConfig = {
  // Default options for all toasts
  duration: 4000,
  position: 'top-right',

  // Success toast styling
  success: {
    duration: 3000,
    style: {
      background: '#10B981',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  },

  // Error toast styling
  error: {
    duration: 5000,
    style: {
      background: '#EF4444',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  },

  // Loading toast styling
  loading: {
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  },
};

/**
 * Common error messages for reuse across the application
 */
export const errorMessages = {
  network: 'Network error. Please check your internet connection.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  serverError: 'A server error occurred. Please try again later.',
  validation: 'Please check your input and try again.',
  fileSize: 'The file you are trying to upload is too large.',
  fileType: 'The file type is not supported.',
  generic: 'An unexpected error occurred. Please try again.',
};

/**
 * Common success messages for reuse across the application
 */
export const successMessages = {
  created: 'Successfully created!',
  updated: 'Successfully updated!',
  deleted: 'Successfully deleted!',
  saved: 'Changes saved successfully!',
  uploaded: 'File uploaded successfully!',
  sent: 'Message sent successfully!',
  invited: 'Invitation sent successfully!',
  approved: 'Approved successfully!',
  rejected: 'Rejected successfully!',
};

export default toastConfig;
