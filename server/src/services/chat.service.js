import Message from "#models/message.model.js";
import Trip from "#models/trip.model.js";

/**
 * Save a new message to the database
 * @param {Object} messageData - Message data
 * @param {string} messageData.trip - Trip ID
 * @param {string} messageData.sender - User ID of the sender
 * @param {string} messageData.text - Message text
 * @returns {Promise<Object>} Created message object
 * @throws {Error} If validation fails
 */
export const saveMessage = async (messageData) => {
  try {
    const { trip, sender, text } = messageData;

    // Create new message
    const message = new Message({
      trip,
      sender,
      text,
    });

    await message.save();

    // Populate sender information
    await message.populate("sender", "name email");

    return {
      id: message._id,
      trip: message.trip,
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all messages for a trip in chronological order with pagination
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the messages
 * @param {Object} options - Pagination options
 * @param {number} options.limit - Number of messages to return (default: 10)
 * @param {string} options.before - Message ID to get messages before (for loading older messages)
 * @returns {Promise<Object>} Object with messages array and hasMore flag
 * @throws {Error} If trip not found or user is not a member
 */
export const getMessagesByTrip = async (tripId, userId, options = {}) => {
  try {
    const { limit = 10, before } = options;

    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error("Access denied: You are not a member of this trip");
    }

    // Build query
    const query = { trip: tripId };

    // If 'before' cursor is provided, only get messages before that message
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    // Get messages for the trip sorted chronologically (newest first for pagination)
    const messages = await Message.find(query)
      .populate("sender", "name email")
      .sort({ createdAt: -1 }) // Sort by creation date descending (newest first)
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

    // Reverse to show oldest first in the returned array
    const formattedMessages = messagesToReturn.reverse().map((message) => ({
      id: message._id,
      trip: message.trip,
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
    }));

    return {
      messages: formattedMessages,
      hasMore,
    };
  } catch (e) {
    throw e;
  }
};
