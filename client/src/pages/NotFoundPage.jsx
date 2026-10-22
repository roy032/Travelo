import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from "../hooks/useTranslation";

/**
 * NotFoundPage component
 * Displays a 404 error page when route is not found
 */
const NotFoundPage = () => {
  const { t } = useTranslation();
  usePageTitle(t("notFound.pageTitle"));
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4 dark:bg-gray-950'>
      <div className='max-w-md w-full text-center'>
        {/* 404 Illustration */}
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-blue-600 dark:text-blue-400'>404</h1>
          <div className='mt-4'>
            <svg
              className='mx-auto h-32 w-32 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h2 className='text-3xl font-bold text-gray-900 mb-4 dark:text-gray-100'>
          {t("notFound.heading")}
        </h2>
        <p className='text-lg text-gray-600 mb-8 dark:text-gray-400'>
          {t("notFound.message")}
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link to='/'>
            <Button variant='primary' className='w-full sm:w-auto'>
              <Home size={18} className='mr-2' />
              {t("notFound.goHome")}
            </Button>
          </Link>
          <Button
            variant='secondary'
            onClick={() => window.history.back()}
            className='w-full sm:w-auto'
          >
            <ArrowLeft size={18} className='mr-2' />
            {t("notFound.goBack")}
          </Button>
        </div>

        {/* Help Text */}
        <div className='mt-12 text-sm text-gray-500 dark:text-gray-400'>
          <p>
            {t("notFound.help")}{" "}
            <a
              href='mailto:support@travelo.com'
              className='text-blue-700 underline hover:no-underline dark:text-blue-300'
            >
              {t("notFound.contact")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
