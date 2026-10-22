import { useEffect, useRef, useState } from "react";
import { connectSocket, getSocket } from "../utils/socket";

/**
 * Live collaboration on a trip page: who else is viewing the trip, and a
 * callback whenever another member changes part of it.
 * @param {string} tripId
 * @param {(change: {resource: string, action: string, actorId?: string}) => void} onChange
 * @returns {{viewerIds: string[], isLive: boolean}}
 */
const useTripLive = (tripId, onChange) => {
  const [viewerIds, setViewerIds] = useState([]);
  const [isLive, setIsLive] = useState(false);
  // Keep the latest callback without re-joining the room on every render
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!tripId) return undefined;
    const socket = getSocket();
    let active = true;

    const watch = () => {
      socket.emit("watchTrip", { tripId }, (response) => {
        if (!active) return;
        if (response?.success) {
          setViewerIds(response.userIds || []);
          setIsLive(true);
        } else {
          setIsLive(false);
        }
      });
    };

    const handlePresence = (data) => {
      if (data?.tripId === tripId) setViewerIds(data.userIds || []);
    };
    const handleChange = (data) => {
      if (data?.tripId === tripId) onChangeRef.current?.(data);
    };
    const handleDisconnect = () => setIsLive(false);

    // Rooms are lost when the connection drops, so watch again on reconnect
    socket.on("connect", watch);
    socket.on("disconnect", handleDisconnect);
    socket.on("tripPresence", handlePresence);
    socket.on("tripChange", handleChange);
    if (socket.connected) watch();
    else connectSocket();

    return () => {
      active = false;
      socket.off("connect", watch);
      socket.off("disconnect", handleDisconnect);
      socket.off("tripPresence", handlePresence);
      socket.off("tripChange", handleChange);
      if (socket.connected) socket.emit("unwatchTrip", { tripId });
    };
  }, [tripId]);

  return { viewerIds, isLive };
};

export default useTripLive;
