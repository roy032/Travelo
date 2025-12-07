import { useState, useCallback, useEffect } from 'react';
import { useErrorHandler } from './useErrorHandler';

/**
 * Custom hook for managing async operations with loading and error states
 * Combines loading state management with error handling
 */
export const useAsync = (asyncFunction, immediate = false, dependencies = []) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'pending' | 'success' | 'error'
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { handleError } = useErrorHandler();

  const execute = useCallback(
    async (...params) => {
      setStatus('pending');
      setData(null);
      setError(null);

      try {
        const response = await asyncFunction(...params);
        setData(response);
        setStatus('success');
        return response;
      } catch (err) {
        setError(err);
        setStatus('error');
        handleError(err);
        throw err;
      }
    },
    [asyncFunction, handleError]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    execute,
    status,
    data,
    error,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    reset: () => {
      setStatus('idle');
      setData(null);
      setError(null);
    },
  };
};

export default useAsync;
