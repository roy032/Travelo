import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe2, Loader2, Search, X } from "lucide-react";
import { destinationApi } from "../services/api.service";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useAsyncData } from "../hooks/useAsyncData";
import DestinationListCard from "../components/destinations/DestinationListCard";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "beach", label: "Beach" },
  { value: "mountain", label: "Mountain" },
  { value: "city", label: "City" },
  { value: "countryside", label: "Countryside" },
  { value: "historical", label: "Historical" },
  { value: "adventure", label: "Adventure" },
];

const SORTS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "rating", label: "Highest rated" },
  { value: "reviews", label: "Most reviewed" },
  { value: "newest", label: "Newest" },
];

const RATINGS = [
  { value: "", label: "Any rating" },
  { value: "3", label: "3+ stars" },
  { value: "4", label: "4+ stars" },
  { value: "4.5", label: "4.5+ stars" },
];

const FILTER_KEYS = ["search", "category", "country", "minRating", "sort"];

/**
 * DestinationsPage - browse destinations with search and filters.
 * Filters live in the URL so results can be shared and survive a reload.
 */
const DestinationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const [countries, setCountries] = useState([]);
  const [retry, setRetry] = useState(0);

  const category = searchParams.get("category") || "";
  const country = searchParams.get("country") || "";
  const minRating = searchParams.get("minRating") || "";
  const sort = searchParams.get("sort") || "name";

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

  useEffect(() => {
    destinationApi
      .getCountries()
      .then(setCountries)
      .catch(() => {});
  }, []);

  const search = searchParams.get("search") || "";
  const loadDestinations = useCallback(
    () => destinationApi.getDestinations({ search, category, country, minRating, sort }),
    // retry re-runs the same request
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, category, country, minRating, sort, retry]
  );
  const { data, error: loadError, loading } = useAsyncData(loadDestinations);
  const destinations = data || [];
  const error = loadError && (loadError.message || "Failed to load destinations");

  const hasFilters = Boolean(search || category || country || minRating);

  const clearFilters = () => {
    setSearchText("");
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        FILTER_KEYS.filter((key) => key !== "sort").forEach((key) =>
          next.delete(key)
        );
        return next;
      },
      { replace: true }
    );
  };

  const selectClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-900";

  return (
    <div className='min-h-screen bg-gray-50 py-8 dark:bg-gray-950'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 text-center'>
          <Globe2 className='w-12 h-12 text-blue-600 mx-auto mb-4 dark:text-blue-400' aria-hidden='true' />
          <h1 className='text-4xl font-bold text-gray-900 mb-2 dark:text-gray-100'>Destinations</h1>
          <p className='text-lg text-gray-600 dark:text-gray-400'>
            Find your next place to go, and see what other travelers thought
          </p>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4 dark:bg-gray-900 dark:border-gray-700'>
          <div className='relative'>
            <Search
              className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
              aria-hidden='true'
            />
            <label htmlFor='destination-search' className='sr-only'>
              Search destinations
            </label>
            <input
              id='destination-search'
              type='search'
              placeholder='Search by name, country or description...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600'
            />
          </div>

          <div className='flex flex-wrap gap-2' role='group' aria-label='Category'>
            {CATEGORIES.map((option) => (
              <button
                key={option.value}
                type='button'
                onClick={() => updateParam("category", option.value)}
                aria-pressed={category === option.value}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div>
              <label htmlFor='destination-country' className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'>
                Country
              </label>
              <select
                id='destination-country'
                value={country}
                onChange={(e) => updateParam("country", e.target.value)}
                className={selectClass}
              >
                <option value=''>All countries</option>
                {countries.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='destination-rating' className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'>
                Rating
              </label>
              <select
                id='destination-rating'
                value={minRating}
                onChange={(e) => updateParam("minRating", e.target.value)}
                className={selectClass}
              >
                {RATINGS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='destination-sort' className='block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300'>
                Sort by
              </label>
              <select
                id='destination-sort'
                value={sort}
                onChange={(e) =>
                  updateParam("sort", e.target.value === "name" ? "" : e.target.value)
                }
                className={selectClass}
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
            <div className='pt-3 border-t border-gray-200 dark:border-gray-700'>
              <button
                type='button'
                onClick={clearFilters}
                className='inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800'
              >
                <X size={16} aria-hidden='true' />
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div aria-live='polite'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-20'>
              <Loader2 className='w-12 h-12 text-blue-600 animate-spin mb-4 dark:text-blue-400' />
              <p className='text-gray-600 dark:text-gray-400'>Loading destinations...</p>
            </div>
          ) : error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center dark:bg-red-950/40 dark:border-red-800'>
              <p className='text-red-700 mb-4 dark:text-red-300'>{error}</p>
              <button
                type='button'
                onClick={() => setRetry((n) => n + 1)}
                className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium'
              >
                Try again
              </button>
            </div>
          ) : destinations.length === 0 ? (
            <div className='text-center py-20'>
              <Globe2 className='w-16 h-16 text-gray-400 mx-auto mb-4' aria-hidden='true' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2 dark:text-gray-100'>
                No destinations found
              </h2>
              <p className='text-gray-600 mb-4 dark:text-gray-400'>
                {hasFilters
                  ? "Try a different search or fewer filters."
                  : "Check back soon for new destinations."}
              </p>
              {hasFilters && (
                <button
                  type='button'
                  onClick={clearFilters}
                  className='text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 dark:hover:text-blue-300'
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className='text-sm text-gray-600 mb-4 dark:text-gray-400'>
                {destinations.length}{" "}
                {destinations.length === 1 ? "destination" : "destinations"}
              </p>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {destinations.map((destination) => (
                  <DestinationListCard key={destination.id} destination={destination} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DestinationsPage;
