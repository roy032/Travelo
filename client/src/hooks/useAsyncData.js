import { useEffect, useState } from 'react';

/**
 * Runs `load` (a memoized function returning a promise) whenever it changes
 * and returns { data, error, loading }. Results from an outdated `load`
 * are ignored, so fast filter changes can't show stale results.
 */
export const useAsyncData = (load) => {
  const [state, setState] = useState({ source: null, data: undefined, error: null });

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setState({ source: load, data, error: null });
      },
      (error) => {
        if (!cancelled) setState({ source: load, data: undefined, error });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [load]);

  const loading = state.source !== load;
  return {
    loading,
    // Keep showing the previous results while new ones load
    data: state.data,
    error: loading ? null : state.error,
  };
};
