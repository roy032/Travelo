// socket.service.js
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  /**
   * Initialize and connect the socket
   * @param {string} token - JWT token
   */
  connect(token) {
    // Close old connection cleanly
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(process.env.EXPO_PUBLIC_BACKEND_URL, {
      transports: ["websocket"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      forceNew: true,
      auth: {
        token: token || null,
      },
    });

    return this.socket;
  }

  /**
   * Return the active socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Join a trip chat room
   */
  joinTrip(tripId) {
    if (this.socket) {
      this.socket.emit("joinTrip", { tripId });
    }
  }

  /**
   * Leave a trip chat room
   */
  leaveTrip(tripId) {
    if (this.socket) {
      this.socket.emit("leaveTrip", { tripId });
    }
  }

  /**
   * Send a message to a trip
   */
  sendMessage(tripId, text) {
    if (this.socket) {
      this.socket.emit("sendMessage", { tripId, text });
    }
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("newMessage", callback);
    }
  }

  /**
   * Remove new message listener
   */
  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off("newMessage", callback);
    }
  }

  /**
   * Listen for joined trip confirmation
   */
  onJoinedTrip(callback) {
    if (this.socket) {
      this.socket.on("joinedTrip", callback);
    }
  }

  /**
   * Remove joined trip listener
   */
  offJoinedTrip(callback) {
    if (this.socket) {
      this.socket.off("joinedTrip", callback);
    }
  }

  /**
   * Listen for left trip confirmation
   */
  onLeftTrip(callback) {
    if (this.socket) {
      this.socket.on("leftTrip", callback);
    }
  }

  /**
   * Remove left trip listener
   */
  offLeftTrip(callback) {
    if (this.socket) {
      this.socket.off("leftTrip", callback);
    }
  }

  /**
   * Listen for user joined room events
   */
  onUserJoinedRoom(callback) {
    if (this.socket) {
      this.socket.on("userJoinedRoom", callback);
    }
  }

  /**
   * Remove user joined room listener
   */
  offUserJoinedRoom(callback) {
    if (this.socket) {
      this.socket.off("userJoinedRoom", callback);
    }
  }

  /**
   * Listen for user left room events
   */
  onUserLeftRoom(callback) {
    if (this.socket) {
      this.socket.on("userLeftRoom", callback);
    }
  }

  /**
   * Remove user left room listener
   */
  offUserLeftRoom(callback) {
    if (this.socket) {
      this.socket.off("userLeftRoom", callback);
    }
  }

  /**
   * Listen for notifications
   */
  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on("newNotification", callback);
    }
  }

  /**
   * Remove notification listener
   */
  offNewNotification(callback) {
    if (this.socket) {
      this.socket.off("newNotification", callback);
    }
  }

  /**
   * Listen for errors
   */
  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  /**
   * Remove error listener
   */
  offError(callback) {
    if (this.socket) {
      this.socket.off("error", callback);
    }
  }

  /**
   * Register event listener safely
   */
  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Emit event safely
   */
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

// Export one global instance
export default new SocketService();
