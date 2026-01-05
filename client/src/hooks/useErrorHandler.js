import { useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for handling errors with user-friendly messages
 * Provides consistent error handling across the application
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error, customMessage = null) => {
    console.error('Error occurred:', error);

    // If a custom message is provided, use it
    if (customMessage) {
      toast.error(customMessage);
      return;
    }

    // Handle API errors
    if (error?.status) {
      switch (error.status) {
        case 400:
          toast.error(error.message || 'Invalid request. Please check your input.');
          break;
        case 401:
          toast.error('Your session has expired. Please log in again.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('The requested resource was not found.');
          break;
        case 409:
          toast.error(error.message || 'This action conflicts with existing data.');
          break;
        case 413:
          toast.error('The file you are trying to upload is too large.');
          break;
        case 415:
          toast.error('The file type is not supported.');
          break;
        case 500:
          toast.error('A server error occurred. Please try again later.');
          break;
        case 503:
          toast.error('The service is temporarily unavailable. Please try again later.');
          break;
        default:
          toast.error(error.message || 'An unexpected error occurred.');
      }
    } else if (error?.message) {
      // Handle JavaScript errors
      toast.error(error.message);
    } else if (typeof error === 'string') {
      // Handle string errors
      toast.error(error);
    } else {
      // Fallback for unknown error types
      toast.error('An unexpected error occurred. Please try again.');
    }
  }, []);

  const handleSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  const handleInfo = useCallback((message) => {
    toast(message, {
      icon: 'ℹ️',
    });
  }, []);

  const handleWarning = useCallback((message) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
      },
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  };
};

export default useErrorHandler;
