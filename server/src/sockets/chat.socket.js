import { jwtToken } from "#utils/jwt.js";
import { saveMessage } from "#services/chat.service.js";
import Trip from "#models/trip.model.js";

/**
 * Initialize Socket.IO chat handlers
 * @param {Server} io - Socket.IO server instance
 */
export const initializeChatSocket = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth, query, or cookies
      let token = socket.handshake.auth.token || socket.handshake.query.token;

      // If no token in auth/query, try to get from cookies
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split("; ");
        const tokenCookie = cookies.find((cookie) =>
          cookie.startsWith("token=")
        );
        if (tokenCookie) {
          token = tokenCookie.split("=")[1];
        }
      }

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify token
      const decoded = jwtToken.verify(token);

      // Attach user info to socket
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    /**
     * Join a trip chat room
     * Client emits: { tripId: string }
     */
    socket.on("joinTrip", async (data) => {
      try {
        const { tripId } = data;

        if (!tripId) {
          socket.emit("error", { message: "Trip ID is required" });
          return;
        }

        // Verify trip exists and user is a member
        const trip = await Trip.findById(tripId);

        if (!trip) {
          socket.emit("error", { message: "Trip not found" });
          return;
        }

        // Verify user is a member
        const isMember = trip.members.some(
          (memberId) => memberId.toString() === socket.userId.toString()
        );

        if (!isMember) {
          socket.emit("error", {
            message: "Access denied: You are not a member of this trip",
          });
          return;
        }

        // Join the trip room
        socket.join(`trip:${tripId}`);

        console.log(`User ${socket.userId} joined trip room: ${tripId}`);

        // Store tripId on socket for tracking
        socket.currentTripId = tripId;

        // Confirm join to the client
        socket.emit("joinedTrip", { tripId, userId: socket.userId });

        // Notify other users in the room that someone joined
        socket.to(`trip:${tripId}`).emit("userJoinedRoom", {
          tripId,
          userId: socket.userId,
          userEmail: socket.userEmail,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error joining trip:", error);
        socket.emit("error", { message: "Failed to join trip chat" });
      }
    });

    /**
     * Leave a trip chat room
     * Client emits: { tripId: string }
     */
    socket.on("leaveTrip", (data) => {
      try {
        const { tripId } = data;

        if (!tripId) {
          socket.emit("error", { message: "Trip ID is required" });
          return;
        }

        // Leave the trip room
        socket.leave(`trip:${tripId}`);

        console.log(`User ${socket.userId} left trip room: ${tripId}`);

        // Notify other users in the room that someone left
        socket.to(`trip:${tripId}`).emit("userLeftRoom", {
          tripId,
          userId: socket.userId,
          userEmail: socket.userEmail,
          timestamp: new Date(),
        });

        // Confirm leave to the client
        socket.emit("leftTrip", { tripId });

        // Clear current trip
        socket.currentTripId = null;
      } catch (error) {
        console.error("Error leaving trip:", error);
        socket.emit("error", { message: "Failed to leave trip chat" });
      }
    });

    /**
     * Send a message to a trip chat
     * Client emits: { tripId: string, text: string }
     */
    socket.on("sendMessage", async (data) => {
      try {
        const { tripId, text } = data;

        if (!tripId || !text) {
          socket.emit("error", {
            message: "Trip ID and message text are required",
          });
          return;
        }

        // Verify trip exists and user is a member
        const trip = await Trip.findById(tripId);

        if (!trip) {
          socket.emit("error", { message: "Trip not found" });
          return;
        }

        // Verify user is a member
        const isMember = trip.members.some(
          (memberId) => memberId.toString() === socket.userId.toString()
        );

        if (!isMember) {
          socket.emit("error", {
            message: "Access denied: You are not a member of this trip",
          });
          return;
        }

        // Save message to database
        const message = await saveMessage({
          trip: tripId,
          sender: socket.userId,
          text: text.trim(),
        });

        // Broadcast message to all members in the trip room
        io.to(`trip:${tripId}`).emit("newMessage", message);

        console.log(`Message sent to trip ${tripId} by user ${socket.userId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Notify room members if user was in a trip room
      if (socket.currentTripId) {
        socket.to(`trip:${socket.currentTripId}`).emit("userLeftRoom", {
          tripId: socket.currentTripId,
          userId: socket.userId,
          userEmail: socket.userEmail,
          timestamp: new Date(),
          reason: "disconnected",
        });
      }
    });
  });
};
