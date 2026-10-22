import { useEffect } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside a dialog while it is open: focuses
 * `initialFocusRef` (or the container) on open, wraps Tab and Shift+Tab, and
 * returns focus to the element that opened it on close or unmount.
 */
export const useFocusTrap = (containerRef, isOpen, initialFocusRef) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement;
    (initialFocusRef?.current || container)?.focus();

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab' || !container) return;
      const focusable = [...container.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const outside = !container.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        first.focus();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, isOpen, initialFocusRef]);
};
