import {
  disableTripSharing,
  enableTripSharing,
  getSharedTrip,
} from "#services/share.service.js";
import { getTripById } from "#services/trip.service.js";
import { getActivitiesByTrip } from "#services/activity.service.js";
import { buildTripCalendar, calendarFileName } from "#utils/calendar.js";
import { getSiteUrl } from "#utils/seo.js";

const notFound = (res) =>
  res.status(404).json({
    error: "Resource not found",
    message: "This shared trip link is no longer available",
  });

const sendCalendar = (res, { trip, activities, url }) => {
  res
    .type("text/calendar; charset=utf-8")
    .set(
      "Content-Disposition",
      `attachment; filename="${calendarFileName(trip.title)}"`,
    )
    .set("Cache-Control", "private, no-cache")
    .send(buildTripCalendar({ trip, activities, url }));
};

/**
 * Turn on the trip's public link (owner only)
 */
export const enableSharingController = async (req, res, next) => {
  try {
    const { shareToken, sharedAt } = await enableTripSharing(req.params.tripId);
    res.status(200).json({
      shareToken,
      sharedAt,
      url: `${getSiteUrl(req)}/share/${shareToken}`,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res
        .status(404)
        .json({ error: "Resource not found", message: "Trip not found" });
    }
    next(e);
  }
};

/**
 * Turn off the trip's public link (owner only)
 */
export const disableSharingController = async (req, res, next) => {
  try {
    await disableTripSharing(req.params.tripId);
    res.status(200).json({ message: "Sharing turned off" });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res
        .status(404)
        .json({ error: "Resource not found", message: "Trip not found" });
    }
    next(e);
  }
};

/**
 * Download the trip and its itinerary as an .ics file (member only)
 */
export const tripCalendarController = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await getTripById(tripId, req.user.id);
    const activities = await getActivitiesByTrip(tripId, req.user.id);
    sendCalendar(res, {
      trip,
      activities,
      url: `${getSiteUrl(req)}/trips/${tripId}`,
    });
  } catch (e) {
    if (e.message === "This trip has been deleted") {
      return res
        .status(404)
        .json({ error: "Resource not found", message: "Trip not found" });
    }
    next(e);
  }
};

/**
 * Public read-only view of a shared trip
 */
export const getSharedTripController = async (req, res, next) => {
  try {
    const shared = await getSharedTrip(req.params.token);
    // Unlisted pages: keep them out of search results
    res.set("X-Robots-Tag", "noindex");
    if (!shared) return notFound(res);
    res.set("Cache-Control", "no-cache").status(200).json(shared);
  } catch (e) {
    next(e);
  }
};

/**
 * Public .ics of a shared trip; calendar apps can also subscribe to this URL
 */
export const sharedCalendarController = async (req, res, next) => {
  try {
    const { token } = req.params;
    const shared = await getSharedTrip(token);
    res.set("X-Robots-Tag", "noindex");
    if (!shared) return notFound(res);
    sendCalendar(res, {
      ...shared,
      url: `${getSiteUrl(req)}/share/${token}`,
    });
  } catch (e) {
    next(e);
  }
};
