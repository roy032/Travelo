import { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  Snowflake,
  Thermometer,
  Droplets,
  ShoppingBag,
  Shirt,
  Watch,
  Package,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getWeatherForecast,
  generatePackingSuggestions,
  getWeatherDescription,
} from "../../../services/weather.service";
import { activityApi } from "../../../services/api.service";
import Loader from "../../ui/Loader";

/**
 * PackageHelper component - displays weather-based packing suggestions
 * @param {string} tripId - Trip ID
 * @param {Date} startDate - Trip start date
 */
const PackageHelper = ({ tripId, startDate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [showHelper, setShowHelper] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    checkIfShouldShow();
  }, [startDate]);

  useEffect(() => {
    if (showHelper) {
      fetchLocationFromActivities();
    }
  }, [showHelper, tripId]);

  useEffect(() => {
    if (showHelper && location?.latitude && location?.longitude) {
      fetchWeatherAndSuggestions();
    }
  }, [location]);

  const fetchLocationFromActivities = async () => {
    try {
      // Fetch trip activities to get location coordinates
      const data = await activityApi.getMapData(tripId);

      // Find first activity with valid coordinates
      const activityWithLocation = data.activities?.find(
        (activity) =>
          activity.location?.coordinates?.lat &&
          activity.location?.coordinates?.lng
      );

      if (activityWithLocation) {
        setLocation({
          latitude: activityWithLocation.location.coordinates.lat,
          longitude: activityWithLocation.location.coordinates.lng,
          name: activityWithLocation.location.name,
        });
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const checkIfShouldShow = () => {
    if (!startDate) {
      setShowHelper(false);
      return;
    }

    const tripDate = new Date(startDate);
    const today = new Date();
    const daysUntilTrip = Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24));

    // Show if trip is within 15 days
    if (daysUntilTrip >= 0 && daysUntilTrip <= 15) {
      setShowHelper(true);
    } else {
      setShowHelper(false);
    }
  };

  const fetchWeatherAndSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const weather = await getWeatherForecast(
        location.latitude,
        location.longitude
      );
      setWeatherData(weather);

      const packingSuggestions = generatePackingSuggestions(weather);
      setSuggestions(packingSuggestions);
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Unable to fetch weather data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!showHelper) {
    return (
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 text-center'>
        <Package className='mx-auto h-12 w-12 text-blue-400 mb-3' />
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Package Helper
        </h3>
        <p className='text-sm text-gray-600'>
          Weather-based packing suggestions will appear when your trip is within
          15 days.
        </p>
      </div>
    );
  }

  if (!location || !location.latitude || !location.longitude) {
    return (
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
        <div className='flex items-start space-x-3'>
          <AlertCircle className='h-5 w-5 text-yellow-600 mt-0.5 shrink-0' />
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-1'>
              Location Required
            </h3>
            <p className='text-sm text-gray-600'>
              Add location coordinates to your trip activities to get
              weather-based packing suggestions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-8'>
        <Loader text='Fetching weather forecast...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
        <div className='flex items-start space-x-3'>
          <AlertCircle className='h-5 w-5 text-red-600 mt-0.5 shrink-0' />
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-1'>Error</h3>
            <p className='text-sm text-gray-600'>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions) {
    return null;
  }

  const { weatherSummary } = suggestions;
  const daysUntilTrip = Math.ceil(
    (new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white'>
        <div className='flex items-center space-x-3 mb-2'>
          <Package className='h-8 w-8' />
          <h2 className='text-2xl font-bold'>Package Helper</h2>
        </div>
        <p className='text-blue-100'>
          Your trip starts in {daysUntilTrip}{" "}
          {daysUntilTrip === 1 ? "day" : "days"}. Here's what to pack based on
          the weather forecast.
        </p>
      </div>

      {/* Weather Summary */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2'>
          <Cloud className='h-5 w-5 text-blue-500' />
          <span>Weather Forecast</span>
        </h3>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {/* Max Temperature */}
          <div className='bg-orange-50 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-1'>
              <Thermometer className='h-4 w-4 text-orange-600' />
              <span className='text-xs font-medium text-orange-900'>High</span>
            </div>
            <p className='text-2xl font-bold text-orange-600'>
              {weatherSummary.maxTemp}°C
            </p>
          </div>

          {/* Min Temperature */}
          <div className='bg-blue-50 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-1'>
              <Snowflake className='h-4 w-4 text-blue-600' />
              <span className='text-xs font-medium text-blue-900'>Low</span>
            </div>
            <p className='text-2xl font-bold text-blue-600'>
              {weatherSummary.minTemp}°C
            </p>
          </div>

          {/* Avg Max */}
          <div className='bg-yellow-50 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-1'>
              <Sun className='h-4 w-4 text-yellow-600' />
              <span className='text-xs font-medium text-yellow-900'>
                Avg High
              </span>
            </div>
            <p className='text-2xl font-bold text-yellow-600'>
              {weatherSummary.avgMaxTemp}°C
            </p>
          </div>

          {/* Rain Chance */}
          <div className='bg-cyan-50 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-1'>
              <Droplets className='h-4 w-4 text-cyan-600' />
              <span className='text-xs font-medium text-cyan-900'>Rain</span>
            </div>
            <p className='text-2xl font-bold text-cyan-600'>
              {weatherSummary.rainChance}%
            </p>
          </div>
        </div>
      </div>

      {/* Packing Suggestions */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Clothing */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <div className='bg-purple-100 p-2 rounded-lg'>
              <Shirt className='h-5 w-5 text-purple-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Clothing</h3>
          </div>
          <ul className='space-y-2'>
            {suggestions.clothing.map((item, index) => (
              <li
                key={index}
                className='flex items-start space-x-2 text-sm text-gray-700'
              >
                <CheckCircle2 className='h-4 w-4 text-green-500 mt-0.5 shrink-0' />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Accessories */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <div className='bg-blue-100 p-2 rounded-lg'>
              <Watch className='h-5 w-5 text-blue-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Accessories</h3>
          </div>
          <ul className='space-y-2'>
            {suggestions.accessories.length > 0 ? (
              suggestions.accessories.map((item, index) => (
                <li
                  key={index}
                  className='flex items-start space-x-2 text-sm text-gray-700'
                >
                  <CheckCircle2 className='h-4 w-4 text-green-500 mt-0.5 shrink-0' />
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className='text-sm text-gray-500 italic'>
                No special accessories needed
              </li>
            )}
          </ul>
        </div>

        {/* Essentials */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <div className='bg-green-100 p-2 rounded-lg'>
              <ShoppingBag className='h-5 w-5 text-green-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Essentials</h3>
          </div>
          <ul className='space-y-2'>
            {suggestions.essentials.map((item, index) => (
              <li
                key={index}
                className='flex items-start space-x-2 text-sm text-gray-700'
              >
                <CheckCircle2 className='h-4 w-4 text-green-500 mt-0.5 shrink-0' />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tip */}
      <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
        <div className='flex items-start space-x-3'>
          <AlertCircle className='h-5 w-5 text-amber-600 mt-0.5 shrink-0' />
          <div>
            <h4 className='text-sm font-semibold text-amber-900 mb-1'>
              Packing Tip
            </h4>
            <p className='text-sm text-amber-800'>
              Weather forecasts can change. Check again closer to your trip date
              and pack layers to adapt to temperature changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageHelper;
