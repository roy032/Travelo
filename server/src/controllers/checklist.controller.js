import { createChecklistItemSchema } from "#validations/checklist.validation.js";
import { formatValidationError } from "#utils/format.js";
import {
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  getChecklistByTrip,
} from "#services/checklist.service.js";
import Notification from "#models/notification.model.js";
import Trip from "#models/trip.model.js";
import { checkIncompleteChecklists } from "../jobs/checklistNotifications.js";

/**
 * Create a new checklist item
 */
export const createItemController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const validationResult = createChecklistItemSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { text } = validationResult.data;

    const itemData = {
      trip: tripId,
      text,
      creator: req.user.id, // From authentication middleware
    };

    const checklistItem = await createChecklistItem(itemData);

    // Get all trip members for notifications
    const trip = await Trip.findById(tripId).populate("members", "_id");

    if (trip) {
      // Create notifications for all trip members except the creator
      const notifications = trip.members
        .filter((member) => member._id.toString() !== req.user.id.toString())
        .map((member) => ({
          user: member._id,
          type: "activity_added",
          title: "Checklist Item Added",
          message: `A new checklist item "${text}" has been added`,
          relatedTrip: tripId,
          relatedResource: checklistItem.id,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({
      message: "Checklist item created successfully",
      checklistItem,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Toggle checklist item checked status
 */
export const toggleItemController = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const checklistItem = await toggleChecklistItem(itemId, req.user.id);

    // Get all trip members for notifications
    const trip = await Trip.findById(checklistItem.trip).populate(
      "members",
      "_id"
    );

    if (trip) {
      // Create notifications for all trip members except the user who toggled
      const action = checklistItem.isChecked ? "checked" : "unchecked";
      const notifications = trip.members
        .filter((member) => member._id.toString() !== req.user.id.toString())
        .map((member) => ({
          user: member._id,
          type: "activity_added",
          title: "Checklist Item Updated",
          message: `A checklist item "${checklistItem.text}" has been ${action}`,
          relatedTrip: checklistItem.trip,
          relatedResource: checklistItem.id,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json({
      message: "Checklist item toggled successfully",
      checklistItem,
    });
  } catch (e) {
    if (e.message === "Checklist item not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Checklist item not found",
      });
    }

    next(e);
  }
};

/**
 * Delete a checklist item
 */
export const deleteItemController = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Get the item before deletion for notifications
    const ChecklistItem = (await import("#models/checklist.model.js")).default;
    const item = await ChecklistItem.findById(itemId);

    if (!item) {
      return res.status(404).json({
        error: "Resource not found",
        message: "Checklist item not found",
      });
    }

    const tripId = item.trip;
    const itemText = item.text;

    const result = await deleteChecklistItem(itemId);

    // Get all trip members for notifications
    const trip = await Trip.findById(tripId).populate("members", "_id");

    if (trip) {
      // Create notifications for all trip members except the deleter
      const notifications = trip.members
        .filter((member) => member._id.toString() !== req.user.id.toString())
        .map((member) => ({
          user: member._id,
          type: "activity_added",
          title: "Checklist Item Deleted",
          message: `A checklist item "${itemText}" has been deleted`,
          relatedTrip: tripId,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json(result);
  } catch (e) {
    if (e.message === "Checklist item not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Checklist item not found",
      });
    }

    next(e);
  }
};

/**
 * Get all checklist items for a trip
 */
export const getChecklistController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const checklistItems = await getChecklistByTrip(tripId, req.user.id);

    res.status(200).json({
      checklistItems,
      count: checklistItems.length,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Access denied: You are not a member of this trip") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not a member of this trip",
      });
    }

    next(e);
  }
};

/**
 * Manually trigger checklist reminder notifications (for testing)
 */
export const triggerChecklistRemindersController = async (req, res, next) => {
  try {
    await checkIncompleteChecklists();

    res.status(200).json({
      message: "Checklist reminder notifications triggered successfully",
    });
  } catch (e) {
    next(e);
  }
};
