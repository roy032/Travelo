import {
  sendMessageSchema,
  getMessagesSchema,
} from "#validations/message.validation.js";
import { formatValidationError } from "#utils/format.js";
import { getTripMessages, createMessage } from "#services/message.service.js";

/**
 * Get paginated messages for a trip
 * GET /trips/:tripId/messages
 */
export const fetchTripMessages = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Validate query parameters
    const validationResult = getMessagesSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { limit, before } = validationResult.data;

    // Fetch messages
    const result = await getTripMessages(tripId, { limit, before });

    res.status(200).json({
      message: "Messages retrieved successfully",
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Send a message to a trip (REST fallback)
 * POST /trips/:tripId/messages
 * Note: Prefer using Socket.IO for real-time messaging
 */
export const sendTripMessage = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const senderId = req.user.id;

    // Validate request body
    const validationResult = sendMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { text } = validationResult.data;

    // Create message
    const message = await createMessage(tripId, senderId, text);

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Not found",
        message: "The specified trip does not exist",
      });
    }

    if (e.message === "Cannot send messages to a deleted trip") {
      return res.status(400).json({
        error: "Invalid operation",
        message: "This trip has been removed and cannot receive messages",
      });
    }

    next(e);
  }
};
