import { getMessagesByTrip } from "#services/chat.service.js";

/**
 * Get messages for a trip (chat history) with pagination
 */
export const getMessagesController = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { limit, before } = req.query;

    const options = {
      limit: limit ? parseInt(limit, 10) : 10,
      before,
    };

    const result = await getMessagesByTrip(tripId, req.user.id, options);

    res.status(200).json({
      messages: result.messages,
      count: result.messages.length,
      hasMore: result.hasMore,
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
