// Helpers for showing a trip's activities in order on a map and by day.
// Activity dates are stored as UTC midnight of the chosen day.

// One colour per day, repeating for longer trips
export const DAY_COLORS = [
  "#2563eb",
  "#db2777",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
];

/** "2030-01-11" for an activity date */
export const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

/** "Sat, 11 Jan" for a day key */
export const formatDay = (key) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const hasCoordinates = (activity) => {
  const lat = activity?.location?.coordinates?.lat;
  const lng = activity?.location?.coordinates?.lng;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
};

/** Activities in itinerary order: by day, then by time */
export const sortActivities = (activities = []) =>
  [...activities].sort(
    (a, b) =>
      dayKey(a.date).localeCompare(dayKey(b.date)) ||
      String(a.time || "").localeCompare(String(b.time || ""), undefined, {
        numeric: true,
      })
  );

/**
 * Group activities into trip days, numbering each stop in itinerary order.
 * Day numbers count from the trip's first day when it is given, so a trip
 * with nothing planned on day 1 still calls its second day "Day 2".
 *
 * @param {Array} activities
 * @param {string|Date} [tripStartDate]
 * @returns {Array<{key: string, dayNumber: number, color: string, stops: Array}>}
 *   each stop is the activity plus `stopNumber` (1-based across the trip)
 */
export const groupByDay = (activities = [], tripStartDate) => {
  const start = tripStartDate
    ? Date.parse(`${dayKey(tripStartDate)}T00:00:00Z`)
    : null;
  const days = [];
  let stopNumber = 0;

  for (const activity of sortActivities(activities)) {
    const key = dayKey(activity.date);
    let day = days[days.length - 1];
    if (!day || day.key !== key) {
      const dayNumber =
        start !== null
          ? Math.round((Date.parse(`${key}T00:00:00Z`) - start) / 86400000) + 1
          : days.length + 1;
      day = {
        key,
        dayNumber,
        color: DAY_COLORS[days.length % DAY_COLORS.length],
        stops: [],
      };
      days.push(day);
    }
    stopNumber += 1;
    day.stops.push({ ...activity, stopNumber });
  }

  return days;
};

/** [lat, lng] pairs of the stops that can be placed on the map */
export const toLatLngs = (stops = []) =>
  stops
    .filter(hasCoordinates)
    .map((stop) => [
      stop.location.coordinates.lat,
      stop.location.coordinates.lng,
    ]);

/** Link that opens a stop in OpenStreetMap */
export const openStreetMapUrl = ({ lat, lng }) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
