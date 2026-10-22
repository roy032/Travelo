import { randomBytes } from "crypto";
import Trip from "#models/trip.model.js";
import Activity from "#models/activity.model.js";

// Unguessable link id: 128 random bits, URL-safe
const newShareToken = () => randomBytes(16).toString("base64url");

export const isShareToken = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);

/**
 * Turn on the public link for a trip, keeping the existing link if there is one
 * @param {string} tripId - Trip ID (the caller has checked the user owns it)
 * @returns {Promise<{shareToken: string, sharedAt: Date}>}
 */
export const enableTripSharing = async (tripId) => {
  const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
  if (!trip) {
    throw new Error("Trip not found");
  }

  if (!trip.shareToken) {
    trip.shareToken = newShareToken();
    trip.sharedAt = new Date();
    await trip.save();
  }

  return { shareToken: trip.shareToken, sharedAt: trip.sharedAt };
};

/**
 * Turn off the public link. Old links stop working, and turning sharing on
 * again creates a new one.
 * @param {string} tripId - Trip ID (the caller has checked the user owns it)
 */
export const disableTripSharing = async (tripId) => {
  const result = await Trip.updateOne(
    { _id: tripId, isDeleted: false },
    { $unset: { shareToken: 1, sharedAt: 1 } },
  );
  if (result.matchedCount === 0) {
    throw new Error("Trip not found");
  }
};

const publicActivity = (activity) => ({
  id: activity._id,
  title: activity.title,
  description: activity.description,
  date: activity.date,
  time: activity.time,
  location: {
    name: activity.location?.name,
    address: activity.location?.address,
    country: activity.location?.country,
    coordinates: activity.location?.coordinates,
  },
});

/**
 * Get the read-only view of a shared trip. Only the plan is shown: no member
 * names or emails, chat, expenses, notes, photos or documents.
 * @param {string} token - Share token from the link
 * @returns {Promise<{trip: Object, activities: Array}|null>} null when the
 *   link is unknown, turned off or the trip was deleted
 */
export const getSharedTrip = async (token) => {
  if (!isShareToken(token)) return null;

  const trip = await Trip.findOne({ shareToken: token, isDeleted: false });
  if (!trip) return null;

  const activities = await Activity.find({ trip: trip._id }).sort({
    date: 1,
    time: 1,
  });

  return {
    trip: {
      id: trip._id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      destinationType: trip.destinationType,
      tripCategory: trip.tripCategory,
      memberCount: trip.members.length,
    },
    activities: activities.map(publicActivity),
  };
};
