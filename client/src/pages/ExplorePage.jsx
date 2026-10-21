import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Compass, Loader2, AlertCircle, Search, X } from "lucide-react";
import TripCard from "../components/explore/TripCard";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { tripApi } from "../services/api.service";

const TRIP_TYPES = [
  { value: "", label: "All Types" },
  { value: "beach", label: "Beach" },
  { value: "mountain", label: "Mountain" },
  { value: "city", label: "City" },
  { value: "countryside", label: "Countryside" },
  { value: "other", label: "Other" },
];

const TRIP_CATEGORIES = [
  { value: "", label: "Domestic & international" },
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

// Each option sets minDays/maxDays
const LENGTHS = [
  { value: "", label: "Any length" },
  { value: "1-3", label: "Weekend (1–3 days)", minDays: 1, maxDays: 3 },
  { value: "4-7", label: "Up to a week (4–7 days)", minDays: 4, maxDays: 7 },
  { value: "8-14", label: "1–2 weeks (8–14 days)", minDays: 8, maxDays: 14 },
  { value: "15-", label: "Longer (15+ days)", minDays: 15 },
];

const SORTS = [
  { value: "soonest", label: "Starting soonest" },
  { value: "latest", label: "Starting latest" },
  { value: "newest", label: "Recently posted" },
  { value: "shortest", label: "Shortest first" },
  { value: "longest", label: "Longest first" },
];

const FILTER_KEYS = ["search", "type", "category", "from", "to", "length"];

const today = () => new Date().toISOString().slice(0, 10);

/**
 * ExplorePage - Displays upcoming trips
 * NO AUTHENTICATION REQUIRED - accessible to all users
 * For logged-in users, shows only trips they are NOT a member of.
 * Filtering happens on the server; filters live in the URL.
 */
const ExplorePage = () => {
  usePageTitle("Explore trips");
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const [retry, setRetry] = useState(0);

  const search = searchParams.get("search") || "";
  const destinationType = searchParams.get("type") || "";
  const tripCategory = searchParams.get("category") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const length = searchParams.get("length") || "";
  const sort = searchParams.get("sort") || "soonest";

  const updateParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  // Push the debounced search text into the URL
  useEffect(() => {
    setSearchParams(
      (prev) => {
        if ((prev.get("search") || "") === debouncedSearch) return prev;
        const next = new URLSearchParams(prev);
        if (debouncedSearch) next.set("search", debouncedSearch);
        else next.delete("search");
        return next;
      },
      { replace: true }
    );
  }, [debouncedSearch, setSearchParams]);

  const loadTrips = useCallback(
    () => {
      const lengthOption = LENGTHS.find((option) => option.value === length);
      return tripApi.getPublicTrips({
        search,
        destinationType,
        tripCategory,
        from,
        to,
        minDays: lengthOption?.minDays,
        maxDays: lengthOption?.maxDays,
        sort,
      });
    },
    // retry re-runs the same request
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, destinationType, tripCategory, from, to, length, sort, retry]
  );
  const { data, error, loading } = useAsyncData(loadTrips);

  // Hide trips the user already owns or belongs to
  const trips = (data || []).filter(
    (trip) =>
      !user?.id ||
      (trip.ownerId !== user.id && !trip.members?.includes(user.id))
  );

  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  const clearFilters = () => {
    setSearchText("");
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        FILTER_KEYS.forEach((key) => next.delete(key));
        return next;
      },
      { replace: true }
    );
  };

  const fieldClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Page Header */}
        <div className='mb-8 text-center'>
          <div className='flex items-center justify-center mb-4'>
            <Compass className='w-12 h-12 text-blue-600' aria-hidden='true' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>
            Explore Trips
          </h1>
          <p className='text-lg text-gray-600'>
            Discover upcoming trips and join amazing adventures
          </p>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4'>
          <div className='relative'>
            <Search
              className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
              aria-hidden='true'
            />
            <label htmlFor='trip-search' className='sr-only'>
              Search trips
            </label>
            <input
              id='trip-search'
              type='search'
              placeholder='Search trips by title or description...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          <div>
            <span className='block text-sm font-medium text-gray-700 mb-2'>
              Destination type
            </span>
            <div className='flex flex-wrap gap-2' role='group' aria-label='Destination type'>
              {TRIP_TYPES.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => updateParam("type", option.value)}
                  aria-pressed={destinationType === option.value}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    destinationType === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
            <div>
              <label htmlFor='trip-category' className={labelClass}>
                Trip
              </label>
              <select
                id='trip-category'
                value={tripCategory}
                onChange={(e) => updateParam("category", e.target.value)}
                className={fieldClass}
              >
                {TRIP_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='trip-from' className={labelClass}>
                Starts after
              </label>
              <input
                id='trip-from'
                type='date'
                value={from}
                min={today()}
                max={to || undefined}
                onChange={(e) => updateParam("from", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor='trip-to' className={labelClass}>
                Starts before
              </label>
              <input
                id='trip-to'
                type='date'
                value={to}
                min={from || today()}
                onChange={(e) => updateParam("to", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor='trip-length' className={labelClass}>
                Length
              </label>
              <select
                id='trip-length'
                value={length}
                onChange={(e) => updateParam("length", e.target.value)}
                className={fieldClass}
              >
                {LENGTHS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='trip-sort' className={labelClass}>
                Sort by
              </label>
              <select
                id='trip-sort'
                value={sort}
                onChange={(e) =>
                  updateParam("sort", e.target.value === "soonest" ? "" : e.target.value)
                }
                className={fieldClass}
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className='pt-3 border-t border-gray-200'>
              <button
                type='button'
                onClick={clearFilters}
                className='inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50'
              >
                <X size={16} aria-hidden='true' />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div aria-live='polite'>
          {/* Loading State */}
          {loading && (
            <div className='flex flex-col items-center justify-center py-20'>
              <Loader2 className='w-12 h-12 text-blue-600 animate-spin mb-4' />
              <p className='text-gray-600'>Loading trips...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-6 mb-8'>
              <div className='flex items-center space-x-3'>
                <AlertCircle className='w-6 h-6 text-red-600' aria-hidden='true' />
                <div>
                  <h2 className='text-red-900 font-semibold'>Error</h2>
                  <p className='text-red-700 text-sm'>
                    {error.message || "Failed to load trips"}
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setRetry((n) => n + 1)}
                className='mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium'
              >
                Try Again
              </button>
            </div>
          )}

          {/* Results Count */}
          {!loading && !error && trips.length > 0 && (
            <p className='mb-6 text-sm text-gray-600'>
              {trips.length} {trips.length === 1 ? "trip" : "trips"}
              {hasFilters ? " match your filters" : ""}
            </p>
          )}

          {/* Empty State */}
          {!loading && !error && trips.length === 0 && (
            <div className='text-center py-20'>
              <Compass className='w-16 h-16 text-gray-400 mx-auto mb-4' aria-hidden='true' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                No Trips Found
              </h2>
              <p className='text-gray-600 mb-4'>
                {hasFilters
                  ? "Try adjusting your filters to see more results"
                  : "Check back later to discover new travel plans!"}
              </p>
              {hasFilters && (
                <button
                  type='button'
                  onClick={clearFilters}
                  className='text-blue-600 hover:text-blue-700 font-medium'
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Trips Grid */}
          {!loading && !error && trips.length > 0 && (
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

export default ExplorePage;
