import Trip from "#models/trip.model.js";
import Activity from "#models/activity.model.js";
import { getTripWeather } from "#services/weather.service.js";
import { generateWeatherPackingItems } from "#services/packing.service.js";

/**
 * Per-day weather for a trip and the packing items it calls for
 * @route GET /api/trips/:tripId/weather
 */
export const getTripWeatherController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // isTripMember has already checked that the trip exists
    const trip = await Trip.findById(tripId).lean();
    const activities = await Activity.find({ trip: tripId })
      .sort({ date: 1, time: 1 })
      .lean();

    const weather = await getTripWeather(trip, activities);

    res.status(200).json({
      tripId,
      ...weather,
      packing: generateWeatherPackingItems(weather.days),
    });
  } catch (e) {
    next(e);
  }
};
