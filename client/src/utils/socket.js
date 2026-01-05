import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let socket = null;

/**
 * Get or create socket connection
 * Token is automatically sent via cookies with withCredentials: true
 * @returns {object} Socket instance
 */
export const getSocket = () => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
};

/**
 * Connect socket if not already connected
 */
export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

/**
 * Check if socket is connected
 * @returns {boolean}
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};
