import Message from "#models/message.model.js";
import Trip from "#models/trip.model.js";

/**
 * Get paginated messages for a trip
 * @param {string} tripId - Trip ID
 * @param {object} options - Pagination options
 * @param {number} options.limit - Number of messages to fetch (default: 10)
 * @param {Date} options.before - Fetch messages before this timestamp (for pagination)
 * @returns {Promise<object>} Messages and pagination metadata
 */
export const getTripMessages = async (tripId, options = {}) => {
  const { limit = 10, before } = options;

  // Build query
  const query = { trip: tripId, isDeleted: false };

  // Add cursor for pagination (fetch messages before this timestamp)
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  // Fetch messages sorted by newest first
  const messages = await Message.find(query)
    .populate("sender", "name email")
    .sort({ createdAt: -1 }) // DESC order
    .limit(limit)
    .lean();

  // Check if there are more messages
  const hasMore = messages.length === limit;

  // Get oldest message timestamp for next cursor
  const oldestMessageTime =
    messages.length > 0 ? messages[messages.length - 1].createdAt : null;

  return {
    messages,
    hasMore,
    nextCursor: hasMore ? oldestMessageTime : null,
  };
};

/**
 * Create a new message
 * @param {string} tripId - Trip ID
 * @param {string} senderId - Sender user ID
 * @param {string} text - Message text
 * @returns {Promise<object>} Created message
 */
export const createMessage = async (tripId, senderId, text) => {
  // Verify trip exists
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.isDeleted) {
    throw new Error("Cannot send messages to a deleted trip");
  }

  // Create message
  const message = await Message.create({
    trip: tripId,
    sender: senderId,
    text: text.trim(),
  });

  // Populate sender details
  await message.populate("sender", "name email");

  return message;
};

/**
 * Delete a message (soft delete)
 * @param {string} messageId - Message ID
 * @param {string} userId - User requesting deletion (must be sender)
 * @returns {Promise<object>} Updated message
 */
export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.sender.toString() !== userId) {
    throw new Error("Only the sender can delete this message");
  }

  message.isDeleted = true;
  await message.save();

  return message;
};

/**
 * Mark message as read by a user
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated message
 */
export const markMessageAsRead = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  // Check if already read
  const alreadyRead = message.readBy.some(
    (read) => read.user.toString() === userId
  );

  if (!alreadyRead) {
    message.readBy.push({ user: userId, readAt: new Date() });
    await message.save();
  }

  return message;
};
