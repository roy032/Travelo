// iCalendar (RFC 5545) export of a trip and its itinerary, so members can add
// the plan to Google Calendar, Apple Calendar or Outlook.

const PRODUCT_ID = "-//Travelo//Trip itinerary//EN";
const UID_DOMAIN = "travelo.app";
// Activities only store a start time; give each one an hour on the calendar
const ACTIVITY_MINUTES = 60;

const pad = (value) => String(value).padStart(2, "0");

/**
 * Escape a TEXT value: backslashes, semicolons, commas and newlines.
 */
export const escapeText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/**
 * Fold a content line to at most 75 octets per line, continuing with a space.
 * Splits on code points so multi-byte characters are never cut in half.
 */
export const foldLine = (line) => {
  const parts = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const bytes = Buffer.byteLength(char, "utf8");
    // Continuation lines start with a space, which counts toward the limit
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
};

// Trip and activity dates are stored as UTC midnight of the chosen day
const dateParts = (value) => {
  const date = new Date(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const formatDate = ({ year, month, day }) => `${year}${pad(month)}${pad(day)}`;

/** All-day DATE value, e.g. 20300110 */
export const toIcsDate = (value) => formatDate(dateParts(value));

/** UTC DATE-TIME value, e.g. 20300110T093000Z */
export const toIcsUtc = (value) => {
  const date = new Date(value);
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
};

const addDays = (value, days) => {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

/**
 * Start and end of an activity as floating local times (no time zone), so
 * 09:30 shows as 09:30 wherever the traveller is, which is what was planned.
 */
export const activityTimes = (date, time) => {
  const [hours, minutes] = String(time || "00:00")
    .split(":")
    .map((part) => Number.parseInt(part, 10) || 0);
  const { year, month, day } = dateParts(date);
  const start = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const end = new Date(start.getTime() + ACTIVITY_MINUTES * 60 * 1000);
  const floating = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
  return { start: floating(start), end: floating(end) };
};

const hasCoordinates = (location) =>
  Number.isFinite(location?.coordinates?.lat) &&
  Number.isFinite(location?.coordinates?.lng);

const describeLocation = (location) =>
  [location?.name, location?.address, location?.country]
    .filter(Boolean)
    // Don't repeat the country when the address already ends with it
    .filter(
      (part, index, all) =>
        index === 0 || !all.slice(0, index).some((prev) => prev.includes(part)),
    )
    .join(", ");

/**
 * Build a VCALENDAR with one all-day event spanning the trip and one event
 * per activity.
 *
 * @param {Object} options
 * @param {Object} options.trip - { id, title, description, startDate, endDate }
 * @param {Array} options.activities - { id, title, description, date, time, location }
 * @param {string} [options.url] - link back to the trip, added to every event
 * @param {Date} [options.now] - DTSTAMP, defaults to the current time
 * @returns {string} calendar text with CRLF line endings
 */
export const buildTripCalendar = ({
  trip,
  activities = [],
  url,
  now = new Date(),
}) => {
  const stamp = toIcsUtc(now);
  const tripId = String(trip.id ?? trip._id);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODUCT_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(trip.title)}`,
  ];

  const tripDescription = [trip.description, url].filter(Boolean).join("\n\n");
  lines.push(
    "BEGIN:VEVENT",
    `UID:trip-${tripId}@${UID_DOMAIN}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(trip.startDate)}`,
    // DTEND of an all-day event is exclusive
    `DTEND;VALUE=DATE:${toIcsDate(addDays(trip.endDate, 1))}`,
    `SUMMARY:${escapeText(trip.title)}`,
    ...(tripDescription
      ? [`DESCRIPTION:${escapeText(tripDescription)}`]
      : []),
    ...(url ? [`URL:${url}`] : []),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  );

  for (const activity of activities) {
    const { start, end } = activityTimes(activity.date, activity.time);
    const location = describeLocation(activity.location);
    lines.push(
      "BEGIN:VEVENT",
      `UID:activity-${activity.id ?? activity._id}@${UID_DOMAIN}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeText(activity.title)}`,
      ...(activity.description
        ? [`DESCRIPTION:${escapeText(activity.description)}`]
        : []),
      ...(location ? [`LOCATION:${escapeText(location)}`] : []),
      ...(hasCoordinates(activity.location)
        ? [
            `GEO:${activity.location.coordinates.lat};${activity.location.coordinates.lng}`,
          ]
        : []),
      ...(url ? [`URL:${url}`] : []),
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
};

/**
 * A safe file name for the download, e.g. "cox-s-bazar-beach-week.ics"
 */
export const calendarFileName = (title) => {
  const slug = String(title || "trip")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `${slug || "trip"}.ics`;
};
