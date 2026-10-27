import cron from "node-cron";
import Trip from "#models/trip.model.js";
import { purgeTrip } from "#services/accountData.service.js";
import { logger } from "#utils/logger.js";

// Deleted trips stay restorable by support for this long, then they and
// everything in them (photos, receipts, messages) are removed for good
export const PURGE_AFTER_DAYS = 30;

/**
 * Permanently remove trips deleted more than PURGE_AFTER_DAYS ago
 * @param {Date} [now]
 * @returns {Promise<number>} how many trips were purged
 */
export const purgeDeletedTrips = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const trips = await Trip.find({ isDeleted: true, deletedAt: { $lte: cutoff } })
    .select("_id")
    .limit(500)
    .lean();
  for (const trip of trips) {
    await purgeTrip(trip._id);
  }
  return trips.length;
};

/** Daily at 03:15 server time */
export const startPurgeDeletedTripsJob = () =>
  cron.schedule("15 3 * * *", async () => {
    try {
      const purged = await purgeDeletedTrips();
      logger.info("Purged deleted trips", { purged });
    } catch (error) {
      logger.error("Purging deleted trips failed", { message: error.message });
    }
  });
