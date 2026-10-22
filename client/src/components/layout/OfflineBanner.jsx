import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useTranslation } from "../../hooks/useTranslation";
import { SW_UPDATED_EVENT } from "../../utils/offline";

/**
 * Tells the user when they are offline (and that saved trips still work),
 * and offers a reload once a new version of the app has been installed.
 */
const OfflineBanner = () => {
  const online = useOnlineStatus();
  const { t } = useTranslation();
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setUpdateReady(true);
    window.addEventListener(SW_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(SW_UPDATED_EVENT, handleUpdate);
  }, []);

  return (
    <div role='status' aria-live='polite'>
      {!online && (
        <div className='bg-amber-50 border-b border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'>
          <p className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200'>
            <WifiOff size={16} className='flex-shrink-0' aria-hidden='true' />
            {t("offline.banner")}
          </p>
        </div>
      )}
      {online && updateReady && (
        <div className='bg-blue-50 border-b border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-sm text-blue-900 dark:text-blue-200'>
            <span>{t("offline.updateReady")}</span>
            <button
              type='button'
              onClick={() => window.location.reload()}
              className='inline-flex items-center gap-1 rounded-md px-3 py-1 font-medium text-blue-800 bg-white border border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-200 dark:bg-gray-900 dark:border-blue-700 dark:hover:bg-gray-800'
            >
              <RefreshCw size={14} aria-hidden='true' />
              {t("offline.reload")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineBanner;
