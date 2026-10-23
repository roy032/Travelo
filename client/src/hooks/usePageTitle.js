import { useEffect } from 'react';

const DEFAULT_TITLE = 'Travelo | Plan group trips together';

/**
 * Set the browser tab title for the current page.
 * @param {string} [title] - page name; omit to use the default site title
 */
export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | Travelo` : DEFAULT_TITLE;
  }, [title]);
};
