import mongoose from "mongoose";
import User from "#models/user.model.js";
import Trip from "#models/trip.model.js";
import ErrorEvent from "#models/errorEvent.model.js";

export const ANALYTICS_RANGES = [7, 30, 90];

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const dayKey = (date) => date.toISOString().slice(0, 10);

/**
 * Store an unexpected server error so admins can chart error rates.
 * Never throws: recording an error must not cause another one.
 */
export const recordServerError = (err, req, status) => {
  if (mongoose.connection.readyState !== 1) return;
  ErrorEvent.create({
    status,
    method: req.method,
    // Drop the query string, which can carry tokens
    path: (req.originalUrl || "").split("?")[0].slice(0, 300),
    message: String(err?.message || "Unknown error").slice(0, 500),
  }).catch(() => {});
};

/** Count documents per UTC day with a $group on createdAt */
const countPerDay = async (Model, match) => {
  const rows = await Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
};

/**
 * Daily sign-ups, active trips and server errors for the last `days` days
 * (today included), plus totals and the latest errors.
 */
export const getAnalytics = async (days, now = new Date()) => {
  const today = startOfUtcDay(now);
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);
  const to = new Date(today.getTime() + DAY_MS);
  const created = { createdAt: { $gte: from, $lt: to } };

  const [signups, errors, trips, recentErrors, totalUsers] = await Promise.all([
    countPerDay(User, created),
    countPerDay(ErrorEvent, created),
    // Trips that overlap the range; each counts as active on the days it spans
    Trip.find({
      isDeleted: { $ne: true },
      startDate: { $lt: to },
      endDate: { $gte: from },
    })
      .select("startDate endDate")
      .lean(),
    ErrorEvent.find(created)
      .sort({ createdAt: -1 })
      .limit(10)
      .select("status method path message createdAt")
      .lean(),
    User.countDocuments(),
  ]);

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const dayStart = new Date(from.getTime() + i * DAY_MS);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const key = dayKey(dayStart);
    series.push({
      date: key,
      signups: signups.get(key) || 0,
      activeTrips: trips.filter(
        (trip) => trip.startDate < dayEnd && trip.endDate >= dayStart
      ).length,
      errors: errors.get(key) || 0,
    });
  }

  const sum = (field) => series.reduce((total, day) => total + day[field], 0);

  return {
    range: { days, from: dayKey(from), to: dayKey(today) },
    totals: {
      users: totalUsers,
      signups: sum("signups"),
      activeTripsToday: series[series.length - 1].activeTrips,
      errors: sum("errors"),
    },
    series,
    recentErrors: recentErrors.map(({ _id, ...error }) => ({ id: _id, ...error })),
  };
};
