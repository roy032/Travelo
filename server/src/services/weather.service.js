/**
 * Per-day trip weather from Open-Meteo (free, no API key).
 *
 * Each trip day gets the location of that day's first activity with
 * coordinates (or the nearest day that has one). Days within the 16-day
 * forecast window use the forecast API. Days further out use what the same
 * date looked like last year from the archive API, marked "typical". Past
 * days use observed archive data. Any request that fails leaves its days
 * marked "unavailable" instead of failing the whole response.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export const FORECAST_WINDOW_DAYS = 16;
export const MAX_TRIP_DAYS = 31;
const FETCH_TIMEOUT_MS = 6000;
const DAY_MS = 24 * 60 * 60 * 1000;

const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

export const describeWeather = (code) =>
  code === null || code === undefined ? null : WEATHER_CODES[code] || 'Unknown';

// ---------------------------------------------------------------------------
// HTTP with a small in-memory cache
// ---------------------------------------------------------------------------

const cache = new Map(); // url -> { data, expiresAt }
const MAX_CACHE_ENTRIES = 500;

const fetchJsonCached = async (url, ttlMs) => {
  const hit = cache.get(url);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data;
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with ${response.status}`);
  }
  const data = await response.json();

  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(url, { data, expiresAt: Date.now() + ttlMs });
  return data;
};

export const clearWeatherCache = () => cache.clear();

// ---------------------------------------------------------------------------
// Dates and locations
// ---------------------------------------------------------------------------

export const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const addDays = (dateKey, days) =>
  toDateKey(new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS));

const daysBetween = (fromKey, toKey) =>
  Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / DAY_MS);

/**
 * Every date of the trip as YYYY-MM-DD, capped at MAX_TRIP_DAYS
 */
export const tripDateKeys = (startDate, endDate) => {
  const start = toDateKey(startDate);
  const total = Math.min(daysBetween(start, toDateKey(endDate)) + 1, MAX_TRIP_DAYS);
  return Array.from({ length: Math.max(total, 1) }, (_, i) => addDays(start, i));
};

// Same calendar day one year earlier (29 Feb becomes 28 Feb)
export const sameDayLastYear = (dateKey) => {
  const [year, month, day] = dateKey.split('-');
  const previous = `${Number(year) - 1}-${month}-${day}`;
  return month === '02' && day === '29' ? `${Number(year) - 1}-02-28` : previous;
};

const hasCoordinates = (activity) =>
  Number.isFinite(activity?.location?.coordinates?.lat) &&
  Number.isFinite(activity?.location?.coordinates?.lng);

/**
 * Pick a location for each trip day from the activities.
 * @returns {Object<string, {name, lat, lng}|null>} dateKey -> location
 */
export const assignDayLocations = (dateKeys, activities) => {
  const byDay = {};
  activities.filter(hasCoordinates).forEach((activity) => {
    const key = toDateKey(activity.date);
    if (!byDay[key]) {
      byDay[key] = {
        name: activity.location.name,
        lat: activity.location.coordinates.lat,
        lng: activity.location.coordinates.lng,
      };
    }
  });

  const known = Object.keys(byDay).sort();
  const result = {};
  dateKeys.forEach((key) => {
    if (byDay[key]) {
      result[key] = byDay[key];
      return;
    }
    if (known.length === 0) {
      result[key] = null;
      return;
    }
    // Nearest day with a location; on a tie, where the traveller already is
    let best = known[0];
    known.forEach((candidate) => {
      const distance = Math.abs(daysBetween(candidate, key));
      const bestDistance = Math.abs(daysBetween(best, key));
      if (distance < bestDistance || (distance === bestDistance && candidate < key)) {
        best = candidate;
      }
    });
    result[key] = byDay[best];
  });
  return result;
};

/**
 * Find coordinates for an activity's place name when none were saved
 */
const geocodeActivities = async (activities) => {
  const names = [
    ...new Set(
      activities
        .map((activity) => activity.location?.name?.trim())
        .filter(Boolean)
    ),
  ].slice(0, 3);

  for (const name of names) {
    try {
      const params = new URLSearchParams({ name, count: '1', format: 'json' });
      const data = await fetchJsonCached(`${GEOCODE_URL}?${params}`, 7 * DAY_MS);
      const place = data.results?.[0];
      if (place) {
        return { name: place.name || name, lat: place.latitude, lng: place.longitude };
      }
    } catch (error) {
      console.warn(`Geocoding "${name}" failed: ${error.message}`);
    }
  }
  return null;
};

// ---------------------------------------------------------------------------
// Open-Meteo requests
// ---------------------------------------------------------------------------

const FORECAST_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'precipitation_sum',
  'wind_speed_10m_max',
  'uv_index_max',
];
const ARCHIVE_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'wind_speed_10m_max',
];

const round1 = (value) =>
  value === null || value === undefined ? null : Math.round(value * 10) / 10;

/**
 * Request daily data for a date range and index it by date
 */
const fetchDaily = async ({ url, fields, location, start, end, ttlMs }) => {
  const params = new URLSearchParams({
    latitude: location.lat.toFixed(4),
    longitude: location.lng.toFixed(4),
    daily: fields.join(','),
    timezone: 'auto',
    start_date: start,
    end_date: end,
  });
  const data = await fetchJsonCached(`${url}?${params}`, ttlMs);
  const daily = data.daily || {};
  const byDate = {};
  (daily.time || []).forEach((date, i) => {
    const value = (field) => daily[field]?.[i] ?? null;
    byDate[date] = {
      weatherCode: value('weather_code'),
      tempMax: round1(value('temperature_2m_max')),
      tempMin: round1(value('temperature_2m_min')),
      precipitationChance: value('precipitation_probability_max'),
      precipitationSum: round1(value('precipitation_sum')),
      windMax: round1(value('wind_speed_10m_max')),
      uvMax: round1(value('uv_index_max')),
    };
  });
  return byDate;
};

const hasData = (entry) =>
  entry && (entry.tempMax !== null || entry.weatherCode !== null);

/**
 * Fill `days` (dateKey -> day object) for one location
 */
const loadLocationWeather = async (location, dateKeys, todayKey, days) => {
  const forecastEnd = addDays(todayKey, FORECAST_WINDOW_DAYS - 1);
  const forecast = dateKeys.filter((key) => key >= todayKey && key <= forecastEnd);
  const past = dateKeys.filter((key) => key < todayKey);
  const later = dateKeys.filter((key) => key > forecastEnd);

  const groups = [
    {
      keys: forecast,
      source: 'forecast',
      url: FORECAST_URL,
      fields: FORECAST_FIELDS,
      ttlMs: 60 * 60 * 1000,
      requestDate: (key) => key,
    },
    {
      keys: past,
      source: 'observed',
      url: ARCHIVE_URL,
      fields: ARCHIVE_FIELDS,
      ttlMs: DAY_MS,
      requestDate: (key) => key,
    },
    {
      keys: later,
      source: 'typical',
      url: ARCHIVE_URL,
      fields: ARCHIVE_FIELDS,
      ttlMs: 7 * DAY_MS,
      requestDate: sameDayLastYear,
    },
  ].filter((group) => group.keys.length > 0);

  await Promise.all(
    groups.map(async (group) => {
      const requestDates = group.keys.map(group.requestDate);
      let byDate = {};
      try {
        byDate = await fetchDaily({
          url: group.url,
          fields: group.fields,
          location,
          start: requestDates[0],
          end: requestDates[requestDates.length - 1],
          ttlMs: group.ttlMs,
        });
      } catch (error) {
        console.warn(`Weather for ${location.name} unavailable: ${error.message}`);
      }

      group.keys.forEach((key, i) => {
        const entry = byDate[requestDates[i]];
        days[key] = hasData(entry)
          ? {
              ...days[key],
              ...entry,
              source: group.source,
              description: describeWeather(entry.weatherCode),
              ...(group.source === 'typical' ? { basedOn: requestDates[i] } : {}),
            }
          : { ...days[key], source: 'unavailable' };
      });
    })
  );
};

/**
 * Weather for every day of a trip
 * @param {Object} trip - Trip with startDate and endDate
 * @param {Array} activities - The trip's activities
 * @param {Object} [options]
 * @param {Date} [options.now] - Override "today" (tests)
 * @returns {Promise<{days: Array, locations: Array, hasLocation: boolean, truncated: boolean}>}
 */
export const getTripWeather = async (trip, activities, { now = new Date() } = {}) => {
  const dateKeys = tripDateKeys(trip.startDate, trip.endDate);
  const fullLength = daysBetween(toDateKey(trip.startDate), toDateKey(trip.endDate)) + 1;
  let locations = assignDayLocations(dateKeys, activities);

  if (dateKeys.every((key) => !locations[key])) {
    const place = await geocodeActivities(activities);
    if (place) {
      locations = Object.fromEntries(dateKeys.map((key) => [key, place]));
    }
  }

  const days = {};
  dateKeys.forEach((key) => {
    days[key] = {
      date: key,
      location: locations[key],
      source: locations[key] ? 'unavailable' : 'no-location',
    };
  });

  // One set of requests per distinct place
  const groups = new Map();
  dateKeys.forEach((key) => {
    const location = locations[key];
    if (!location) return;
    const id = `${location.lat.toFixed(2)},${location.lng.toFixed(2)}`;
    if (!groups.has(id)) groups.set(id, { location, keys: [] });
    groups.get(id).keys.push(key);
  });

  const todayKey = toDateKey(now);
  await Promise.all(
    [...groups.values()].map(({ location, keys }) =>
      loadLocationWeather(location, keys, todayKey, days)
    )
  );

  const uniqueLocations = [...groups.values()].map(({ location }) => location);

  return {
    days: dateKeys.map((key) => days[key]),
    locations: uniqueLocations,
    hasLocation: uniqueLocations.length > 0,
    truncated: fullLength > dateKeys.length,
    attribution: 'Weather data by Open-Meteo.com',
  };
};
