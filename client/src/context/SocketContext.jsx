import { createContext, useContext, useEffect, useState } from "react";
import socketService from "../services/socket.service";
import { useAuth } from "../hooks/useAuth";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Establish socket connection and update state with the live socket instance
   */
  const connect = () => {
    if (!isAuthenticated || !user) return;

    // Prevent duplicate connections
    if (socketService.isConnected()) return;

    const s = socketService.connect();

    // Store live socket instance in React state
    setSocket(s);

    // Attach connection status update handlers
    s.on("connect", () => {
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });
  };

  /**
   * Disconnect cleanly
   */
  const disconnect = () => {
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
  };

  /**
   * Auto-disconnect when user logs out
   */
  useEffect(() => {
    if (!isAuthenticated) {
      disconnect();
    }
  }, [isAuthenticated]);

  const value = {
    socket,
    isConnected,
    connect,
    disconnect,

    // Real-time actions using updated socket instance
    joinTrip: (tripId) => socketService.joinTrip(tripId),
    leaveTrip: (tripId) => socketService.leaveTrip(tripId),
    sendMessage: (tripId, text) => socketService.sendMessage(tripId, text),

    onNewMessage: (cb) => socketService.onNewMessage(cb),
    offNewMessage: (cb) => socketService.offNewMessage(cb),

    onJoinedTrip: (cb) => socketService.onJoinedTrip(cb),
    offJoinedTrip: (cb) => socketService.offJoinedTrip(cb),

    onLeftTrip: (cb) => socketService.onLeftTrip(cb),
    offLeftTrip: (cb) => socketService.offLeftTrip(cb),

    onNewNotification: (cb) => socketService.onNewNotification(cb),
    offNewNotification: (cb) => socketService.offNewNotification(cb),

    onUserJoinedRoom: (cb) => socketService.onUserJoinedRoom(cb),
    offUserJoinedRoom: (cb) => socketService.offUserJoinedRoom(cb),

    onUserLeftRoom: (cb) => socketService.onUserLeftRoom(cb),
    offUserLeftRoom: (cb) => socketService.offUserLeftRoom(cb),

    onError: (cb) => socketService.onError(cb),
    offError: (cb) => socketService.offError(cb),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
