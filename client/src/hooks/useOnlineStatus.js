import { useEffect, useState } from 'react';

/** Whether the browser currently has a network connection. */
export const useOnlineStatus = () => {
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine !== false
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
};
