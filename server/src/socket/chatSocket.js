import { Server } from "socket.io";
import { jwtToken } from "#utils/jwt.js";
import Trip from "#models/trip.model.js";
import { createMessage } from "#services/message.service.js";

let io;

/**
 * Initialize Socket.IO server
 * @param {object} httpServer - HTTP server instance
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      // Extract token from cookies or auth header
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.cookie
          ?.split("; ")
          ?.find((c) => c.startsWith("token="))
          ?.split("=")[1];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify JWT token
      const decoded = jwtToken.verify(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Handle joining a trip chatroom
    socket.on("joinRoom", async ({ tripId }, callback) => {
      try {
        // Verify user is a member of the trip
        const trip = await Trip.findById(tripId);

        if (!trip) {
          return callback?.({ error: "Trip not found" });
        }

        if (trip.isDeleted) {
          return callback?.({ error: "Trip has been deleted" });
        }

        // Check if user is owner or member
        const isMember =
          trip.owner.toString() === socket.userId ||
          trip.members.some((m) => m.toString() === socket.userId);

        if (!isMember) {
          return callback?.({ error: "You are not a member of this trip" });
        }

        // Join the room
        const roomName = `trip_${tripId}`;
        socket.join(roomName);
        socket.currentRoom = roomName;
        socket.currentTripId = tripId;

        console.log(`User ${socket.userId} joined room: ${roomName}`);

        // Notify others in the room
        socket.to(roomName).emit("userJoined", {
          userId: socket.userId,
          timestamp: new Date(),
        });

        callback?.({ success: true, room: roomName });
      } catch (error) {
        console.error("Error joining room:", error);
        callback?.({ error: "Failed to join room" });
      }
    });

    // Handle leaving a room
    socket.on("leaveRoom", ({ tripId }, callback) => {
      try {
        const roomName = `trip_${tripId}`;
        socket.leave(roomName);

        if (socket.currentRoom === roomName) {
          socket.currentRoom = null;
          socket.currentTripId = null;
        }

        console.log(`User ${socket.userId} left room: ${roomName}`);

        // Notify others
        socket.to(roomName).emit("userLeft", {
          userId: socket.userId,
          timestamp: new Date(),
        });

        callback?.({ success: true });
      } catch (error) {
        console.error("Error leaving room:", error);
        callback?.({ error: "Failed to leave room" });
      }
    });

    // Handle sending a message
    socket.on("sendMessage", async ({ tripId, text }, callback) => {
      try {
        // Verify user is in the room
        if (socket.currentTripId !== tripId) {
          return callback?.({ error: "You must join the room first" });
        }

        // Validate text
        if (!text || text.trim().length === 0) {
          return callback?.({ error: "Message cannot be empty" });
        }

        if (text.length > 2000) {
          return callback?.({
            error: "Message too long (max 2000 characters)",
          });
        }

        // Create message in database
        const message = await createMessage(tripId, socket.userId, text);

        // Broadcast to all users in the room (including sender)
        const roomName = `trip_${tripId}`;
        io.to(roomName).emit("newMessage", {
          _id: message._id,
          trip: message.trip,
          sender: message.sender,
          text: message.text,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        });

        callback?.({
          success: true,
          messageId: message._id,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        callback?.({ error: error.message || "Failed to send message" });
      }
    });

    // Handle typing indicator (future feature)
    socket.on("typing", ({ tripId, isTyping }) => {
      if (socket.currentTripId === tripId) {
        const roomName = `trip_${tripId}`;
        socket.to(roomName).emit("userTyping", {
          userId: socket.userId,
          isTyping,
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Notify room if user was in one
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("userLeft", {
          userId: socket.userId,
          timestamp: new Date(),
        });
      }
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 * @returns {object} Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};
