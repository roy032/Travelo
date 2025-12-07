import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states
 * Provides a simple interface for tracking async operations
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((err) => {
    setError(err);
    setIsLoading(false);
  }, []);

  const resetLoading = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Wrapper function to execute async operations with automatic loading state management
   * @param {Function} asyncFn - The async function to execute
   * @param {Object} options - Options for error handling
   * @returns {Promise} - The result of the async function
   */
  const executeAsync = useCallback(async (asyncFn, options = {}) => {
    const { onError, onSuccess, throwError = false } = options;

    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      setLoadingError(err);

      if (onError) {
        onError(err);
      }

      if (throwError) {
        throw err;
      }

      return null;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    resetLoading,
    executeAsync,
  };
};

export default useLoading;
