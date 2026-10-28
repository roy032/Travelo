import {
  applyPlanSchema,
  planRequestSchema,
} from "#validations/aiPlanner.validation.js";
import { formatValidationError } from "#utils/format.js";
import {
  applyItinerary,
  generateItinerary,
  isPlannerEnabled,
  MAX_PLAN_DAYS,
} from "#services/aiPlanner.service.js";

/**
 * Whether the AI planner can be used on this server
 */
export const plannerStatusController = (req, res) => {
  res.status(200).json({ enabled: isPlannerEnabled(), maxDays: MAX_PLAN_DAYS });
};

/**
 * Suggest a day-by-day plan for a trip (nothing is saved)
 */
export const suggestPlanController = async (req, res, next) => {
  try {
    const validation = planRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validation.error),
      });
    }

    const plan = await generateItinerary(req.trip, validation.data);
    res.status(200).json({ plan });
  } catch (e) {
    next(e);
  }
};

/**
 * Add the chosen activities from a plan to the trip itinerary
 */
export const applyPlanController = async (req, res, next) => {
  try {
    const validation = applyPlanSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validation.error),
      });
    }

    const activities = await applyItinerary(
      req.trip,
      validation.data.activities,
      req.user.id
    );
    res.locals.liveChange = { tripId: req.trip._id, resource: "activities" };

    res.status(201).json({
      message: `${activities.length} activities added to the itinerary`,
      activities,
    });
  } catch (e) {
    next(e);
  }
};
