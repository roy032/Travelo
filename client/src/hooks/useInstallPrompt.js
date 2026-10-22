import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

/**
 * Offer "Install app" where the browser supports it (Chrome, Edge, Android).
 * Returns null when the app cannot be installed or already is.
 * @returns {null | (() => Promise<void>)} call to show the install dialog
 */
export const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    if (isStandalone()) return undefined;

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const handleInstalled = () => setPromptEvent(null);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  return async () => {
    promptEvent.prompt();
    await promptEvent.userChoice;
    // A prompt event can only be used once
    setPromptEvent(null);
  };
};
