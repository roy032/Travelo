import { useState, useEffect, useCallback } from "react";
import { getSocket, connectSocket, disconnectSocket } from "../utils/socket";

/**
 * Custom hook for managing Socket.IO connection and trip chatroom
 * @param {string} tripId - Trip ID to join
 * @returns {object} Socket utilities and state
 */
const useSocket = (tripId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket
  useEffect(() => {
    // Socket will use cookies automatically via withCredentials
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // Connect socket
    connectSocket();

    // Connection event handlers
    const handleConnect = () => {
      console.log("Socket connected");
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      setIsJoined(false);
    };

    const handleConnectError = (err) => {
      console.error("Socket connection error:", err);
      setError(err.message || "Connection failed");
      setIsConnected(false);
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);

    // Cleanup
    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
    };
  }, []);

  // Join room when socket connects and tripId is available
  useEffect(() => {
    if (!socket || !isConnected || !tripId || isJoined) return;

    socket.emit("joinRoom", { tripId }, (response) => {
      if (response?.error) {
        console.error("Failed to join room:", response.error);
        setError(response.error);
        setIsJoined(false);
      } else {
        console.log("Successfully joined room:", response?.room);
        setIsJoined(true);
        setError(null);
      }
    });

    return () => {
      // Leave room on unmount
      if (isJoined) {
        socket.emit("leaveRoom", { tripId }, (response) => {
          if (response?.error) {
            console.error("Failed to leave room:", response.error);
          } else {
            console.log("Successfully left room");
            setIsJoined(false);
          }
        });
      }
    };
  }, [socket, isConnected, tripId, isJoined]);

  // Send message
  const sendMessage = useCallback(
    (text, callback) => {
      if (!socket || !isJoined) {
        const error = "Cannot send message: not connected to room";
        console.error(error);
        callback?.({ error });
        return;
      }

      socket.emit("sendMessage", { tripId, text }, (response) => {
        if (response?.error) {
          console.error("Failed to send message:", response.error);
        }
        callback?.(response);
      });
    },
    [socket, isJoined, tripId]
  );

  // Subscribe to new messages
  const onNewMessage = useCallback(
    (handler) => {
      if (!socket) return () => {};

      socket.on("newMessage", handler);

      return () => {
        socket.off("newMessage", handler);
      };
    },
    [socket]
  );

  // Subscribe to typing indicator
  const onUserTyping = useCallback(
    (handler) => {
      if (!socket) return () => {};

      socket.on("userTyping", handler);

      return () => {
        socket.off("userTyping", handler);
      };
    },
    [socket]
  );

  // Emit typing indicator
  const emitTyping = useCallback(
    (isTyping) => {
      if (!socket || !isJoined) return;
      socket.emit("typing", { tripId, isTyping });
    },
    [socket, isJoined, tripId]
  );

  return {
    socket,
    isConnected,
    isJoined,
    error,
    sendMessage,
    onNewMessage,
    onUserTyping,
    emitTyping,
  };
};

export default useSocket;
