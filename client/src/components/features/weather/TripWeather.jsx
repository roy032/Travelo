import { createElement, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  Package,
  RefreshCw,
  Sun,
  Wind,
} from "lucide-react";
import { packingApi, weatherApi } from "../../../services/api.service";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";

// Open-Meteo weather codes grouped by the icon that fits them
const iconFor = (code) => {
  if (code === null || code === undefined) return Cloud;
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 77 || code === 85 || code === 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
};

const SOURCE_BADGES = {
  forecast: {
    label: "Forecast",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  },
  typical: {
    label: "Typical",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  },
  observed: {
    label: "Observed",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  unavailable: {
    label: "No data",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200",
  },
  "no-location": {
    label: "No location",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200",
  },
};

const formatDay = (dateKey) =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const DayCard = ({ day, showLocation }) => {
  const badge = SOURCE_BADGES[day.source] || SOURCE_BADGES.unavailable;
  const hasData = day.tempMax !== undefined && day.tempMax !== null;
  const rain =
    day.precipitationChance !== null && day.precipitationChance !== undefined
      ? `${day.precipitationChance}%`
      : day.precipitationSum !== null && day.precipitationSum !== undefined
        ? `${day.precipitationSum} mm`
        : null;

  return (
    <li className='flex flex-col rounded-lg border border-gray-200 bg-white p-4 dark:bg-gray-900 dark:border-gray-700'>
      <div className='flex items-start justify-between gap-2'>
        <p className='font-semibold text-gray-900 dark:text-gray-100'>{formatDay(day.date)}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          title={
            day.source === "typical" && day.basedOn
              ? `Based on the weather on ${day.basedOn}`
              : undefined
          }
        >
          {badge.label}
        </span>
      </div>
      {showLocation && day.location && (
        <p className='mt-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400'>
          <MapPin size={12} aria-hidden='true' />
          {day.location.name}
        </p>
      )}

      {hasData ? (
        <>
          <div className='mt-3 flex items-center gap-3'>
            {createElement(iconFor(day.weatherCode), {
              size: 36,
              "aria-hidden": "true",
              className: "text-blue-600 dark:text-blue-400",
            })}
            <div>
              <p className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                {Math.round(day.tempMax)}°
                <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  {" "}/ {Math.round(day.tempMin)}°C
                </span>
              </p>
              <p className='text-sm text-gray-700 dark:text-gray-300'>{day.description}</p>
            </div>
          </div>
          <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400'>
            {rain && (
              <span className='flex items-center gap-1'>
                <Droplets size={14} aria-hidden='true' />
                Rain {rain}
              </span>
            )}
            {day.windMax !== null && day.windMax !== undefined && (
              <span className='flex items-center gap-1'>
                <Wind size={14} aria-hidden='true' />
                {Math.round(day.windMax)} km/h
              </span>
            )}
          </div>
        </>
      ) : (
        <p className='mt-3 text-sm text-gray-600 dark:text-gray-400'>
          {day.source === "no-location"
            ? "Add an activity with a location to see weather."
            : "Weather isn't available for this day right now."}
        </p>
      )}
    </li>
  );
};

/**
 * Weather for every trip day and the packing items it calls for
 */
const TripWeather = ({ tripId, onChecklistUpdated }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await weatherApi.getTripWeather(tripId);
      setData(result);
      setSelected((result.packing || []).map((entry) => entry.item));
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("We couldn't load the weather. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tripId]);

  const toggle = (item) =>
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((other) => other !== item) : [...prev, item]
    );

  const addToChecklist = async () => {
    try {
      setAdding(true);
      const result = await packingApi.addSuggestionsToChecklist(tripId, selected);
      const added = result.items?.length ?? 0;
      const skipped = result.skipped ?? 0;
      toast.success(
        skipped > 0
          ? `Added ${added} to the checklist (${skipped} already there)`
          : `Added ${added} to the checklist`
      );
      onChecklistUpdated?.();
    } catch (err) {
      console.error("Error adding packing items:", err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className='py-8'>
        <Loader text='Fetching the weather...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-wrap items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/40 dark:border-red-800'>
        <p className='flex items-start gap-2 text-sm text-red-800 dark:text-red-200'>
          <AlertCircle size={18} aria-hidden='true' className='mt-0.5 shrink-0' />
          {error}
        </p>
        <Button size='sm' variant='outline' onClick={load}>
          <RefreshCw size={16} className='mr-1' aria-hidden='true' />
          Retry
        </Button>
      </div>
    );
  }

  const days = data?.days || [];
  const packing = data?.packing || [];
  const locationNames = new Set(days.map((day) => day.location?.name).filter(Boolean));
  const hasTypical = days.some((day) => day.source === "typical");

  return (
    <div className='space-y-8'>
      <section aria-labelledby='weather-title'>
        <div className='mb-4 flex flex-wrap items-baseline justify-between gap-2'>
          <h2 id='weather-title' className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            Weather by Day
          </h2>
          {locationNames.size === 1 && (
            <p className='flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400'>
              <MapPin size={14} aria-hidden='true' />
              {[...locationNames][0]}
            </p>
          )}
        </div>

        {!data?.hasLocation && (
          <div className='mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/40 dark:border-amber-800'>
            <AlertCircle size={20} aria-hidden='true' className='mt-0.5 shrink-0 text-amber-700 dark:text-amber-300' />
            <p className='text-sm text-amber-900 dark:text-amber-100'>
              Add activities with a location to your itinerary and we'll show the
              weather for each day of the trip.
            </p>
          </div>
        )}

        <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {days.map((day) => (
            <DayCard key={day.date} day={day} showLocation={locationNames.size > 1} />
          ))}
        </ul>

        <p className='mt-3 text-xs text-gray-600 dark:text-gray-400'>
          {hasTypical &&
            "Forecasts reach 16 days ahead. Days marked Typical show the weather on the same date last year. "}
          {data?.truncated && "Only the first 31 days are shown. "}
          <a
            href='https://open-meteo.com/'
            target='_blank'
            rel='noopener noreferrer'
            className='underline hover:text-gray-900 dark:hover:text-gray-100'
          >
            Weather data by Open-Meteo.com
          </a>
        </p>
      </section>

      <section aria-labelledby='weather-packing-title'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
          <h2
            id='weather-packing-title'
            className='flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100'
          >
            <Package size={22} aria-hidden='true' className='text-blue-600 dark:text-blue-400' />
            Pack for the Weather
          </h2>
          {packing.length > 0 && (
            <Button
              size='sm'
              onClick={addToChecklist}
              loading={adding}
              disabled={adding || selected.length === 0}
            >
              Add {selected.length} to checklist
            </Button>
          )}
        </div>

        {packing.length === 0 ? (
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {data?.hasLocation
              ? "Nothing special needed for this weather. The Checklist tab has general packing suggestions."
              : "Packing suggestions appear once we know where you're going."}
          </p>
        ) : (
          <ul className='grid grid-cols-1 gap-2 md:grid-cols-2'>
            {packing.map((entry) => {
              const id = `pack-${entry.item.replace(/\W+/g, "-").toLowerCase()}`;
              return (
                <li key={entry.item}>
                  <label
                    htmlFor={id}
                    className='flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800'
                  >
                    <input
                      id={id}
                      type='checkbox'
                      checked={selected.includes(entry.item)}
                      onChange={() => toggle(entry.item)}
                      className='mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600'
                    />
                    <span>
                      <span className='block font-medium text-gray-900 dark:text-gray-100'>
                        {entry.item}
                      </span>
                      <span className='block text-xs text-gray-600 dark:text-gray-400'>
                        {entry.reason}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TripWeather;
