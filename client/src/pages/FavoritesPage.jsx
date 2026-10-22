import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { favoriteApi } from "../services/api.service";
import { useAsyncData } from "../hooks/useAsyncData";
import { useFavorites } from "../hooks/useFavorites";
import DestinationListCard from "../components/destinations/DestinationListCard";
import TripCard from "../components/explore/TripCard";

const TABS = [
  { value: "destinations", label: "Destinations" },
  { value: "trips", label: "Trips" },
];

/**
 * FavoritesPage - the user's saved destinations and trips
 */
const FavoritesPage = () => {
  const [tab, setTab] = useState("destinations");
  const { isFavorite } = useFavorites();
  const loadFavorites = useCallback(() => favoriteApi.getFavorites(), []);
  const { data, loading, error } = useAsyncData(loadFavorites);

  // Items unsaved on this page disappear right away
  const destinations = (data?.destinations || []).filter((d) =>
    isFavorite("destination", d.id)
  );
  const trips = (data?.trips || []).filter((t) => isFavorite("trip", t.id));
  const counts = { destinations: destinations.length, trips: trips.length };

  return (
    <div className='min-h-screen bg-gray-50 py-8 dark:bg-gray-950'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3 dark:text-gray-100'>
            <Heart className='w-8 h-8 fill-pink-500 text-pink-500' aria-hidden='true' />
            Saved
          </h1>
          <p className='text-gray-600 mt-1 dark:text-gray-400'>
            Destinations and trips you&apos;ve saved for later
          </p>
        </div>

        <div
          className='flex gap-2 border-b border-gray-200 mb-6 dark:border-gray-700'
          role='tablist'
          aria-label='Saved item type'
          onKeyDown={(event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            event.preventDefault();
            const index = TABS.findIndex((option) => option.value === tab);
            const step = event.key === "ArrowRight" ? 1 : -1;
            const next = TABS[(index + step + TABS.length) % TABS.length].value;
            setTab(next);
            document.getElementById(`saved-tab-${next}`)?.focus();
          }}
        >
          {TABS.map((option) => (
            <button
              key={option.value}
              type='button'
              role='tab'
              id={`saved-tab-${option.value}`}
              aria-selected={tab === option.value}
              aria-controls='saved-tabpanel'
              tabIndex={tab === option.value ? 0 : -1}
              onClick={() => setTab(option.value)}
              className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
                tab === option.value
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {option.label}
              {data && (
                <span className='ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs dark:bg-gray-800 dark:text-gray-300'>
                  {counts[option.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          role='tabpanel'
          id='saved-tabpanel'
          aria-labelledby={`saved-tab-${tab}`}
          aria-live='polite'
        >
          {loading ? (
            <div className='flex justify-center py-20'>
              <Loader2 className='w-12 h-12 text-blue-600 animate-spin dark:text-blue-400' aria-label='Loading saved items' />
            </div>
          ) : error ? (
            <p className='text-center text-red-700 py-20 dark:text-red-300'>
              Couldn&apos;t load your saved items. Please refresh the page.
            </p>
          ) : tab === "destinations" ? (
            destinations.length === 0 ? (
              <EmptySaved
                message='Tap the heart on a destination to save it here.'
                linkTo='/destinations'
                linkLabel='Browse destinations'
              />
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {destinations.map((destination) => (
                  <DestinationListCard key={destination.id} destination={destination} />
                ))}
              </div>
            )
          ) : trips.length === 0 ? (
            <EmptySaved
              message='Tap the heart on a trip in Explore to save it here.'
              linkTo='/explore'
              linkLabel='Explore trips'
            />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptySaved = ({ message, linkTo, linkLabel }) => (
  <div className='text-center py-20'>
    <Heart className='w-16 h-16 text-gray-300 mx-auto mb-4' aria-hidden='true' />
    <h2 className='text-xl font-semibold text-gray-900 mb-2 dark:text-gray-100'>Nothing saved yet</h2>
    <p className='text-gray-600 mb-4 dark:text-gray-400'>{message}</p>
    <Link to={linkTo} className='text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 dark:hover:text-blue-300'>
      {linkLabel}
    </Link>
  </div>
);

export default FavoritesPage;
