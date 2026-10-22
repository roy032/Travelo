import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  Compass,
  MapPin,
  Users,
} from "lucide-react";
import Loader from "../components/ui/Loader";
import ItineraryMap from "../components/features/trips/ItineraryMap";
import { shareApi } from "../services/api.service";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/**
 * SharedTripPage - read-only view of a trip whose owner turned on a public
 * link. NO AUTHENTICATION REQUIRED.
 */
const SharedTripPage = () => {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const load = useCallback(() => shareApi.getSharedTrip(token), [token]);
  const { data, error, loading } = useAsyncData(load);
  usePageTitle(data?.trip?.title ?? "Shared trip");

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader />
      </div>
    );
  }

  if (error || !data) {
    const gone = error?.status === 404;
    return (
      <div className='min-h-[60vh] flex items-center justify-center px-4'>
        <div className='text-center max-w-md'>
          <AlertCircle
            className='w-12 h-12 text-gray-400 mx-auto mb-4'
            aria-hidden='true'
          />
          <h1 className='text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100'>
            {gone ? "This link isn't available" : "Something went wrong"}
          </h1>
          <p className='text-gray-600 mb-6 dark:text-gray-400'>
            {gone
              ? "The trip organizer may have turned off sharing or deleted the trip."
              : "We couldn't load this trip. Please try again in a moment."}
          </p>
          <Link
            to='/explore'
            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
          >
            <Compass size={18} className='mr-2' aria-hidden='true' />
            Explore trips
          </Link>
        </div>
      </div>
    );
  }

  const { trip, activities } = data;
  const calendarUrl = shareApi.calendarUrl(token);
  const subscribeUrl = calendarUrl.replace(/^https?:/, "webcal:");

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
      <div className='bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <p className='text-sm font-medium text-blue-600 mb-2 dark:text-blue-400'>Shared trip plan</p>
          <h1 className='text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100'>{trip.title}</h1>
          {trip.description && (
            <p className='text-gray-600 mb-4 whitespace-pre-line dark:text-gray-400'>
              {trip.description}
            </p>
          )}
          <div className='flex flex-wrap gap-4 text-sm text-gray-600 mb-4 dark:text-gray-400'>
            <span className='flex items-center'>
              <Calendar size={16} className='mr-2' aria-hidden='true' />
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </span>
            {trip.destinationType && (
              <span className='flex items-center capitalize'>
                <MapPin size={16} className='mr-2' aria-hidden='true' />
                {trip.destinationType}
              </span>
            )}
            <span className='flex items-center'>
              <Users size={16} className='mr-2' aria-hidden='true' />
              {trip.memberCount}{" "}
              {trip.memberCount === 1 ? "traveller" : "travellers"}
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            <a
              href={calendarUrl}
              className='inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
            >
              <CalendarPlus size={16} className='mr-2' aria-hidden='true' />
              Add to calendar
            </a>
            <a
              href={subscribeUrl}
              className='inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
              title='Your calendar app keeps the plan up to date'
            >
              Subscribe in calendar app
            </a>
          </div>
        </div>
      </div>

      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6'>
        <section className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4 dark:text-gray-100'>Itinerary</h2>
          <ItineraryMap activities={activities} tripStartDate={trip.startDate} />
        </section>

        {!isAuthenticated && (
          <section className='bg-blue-600 text-white rounded-lg p-6 text-center'>
            <h2 className='text-xl font-semibold mb-2'>
              Planning a trip with friends?
            </h2>
            <p className='text-blue-100 mb-4'>
              Build a shared itinerary, split expenses and pack together on
              Travelo. It&apos;s free.
            </p>
            <Link
              to='/register'
              className='inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-300'
            >
              Create a free account
            </Link>
          </section>
        )}
      </div>
    </div>
  );
};

export default SharedTripPage;
