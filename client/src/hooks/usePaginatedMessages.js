import { useState, useEffect, useCallback, useRef } from "react";
import { messageApi } from "../services/api.service";

/**
 * Custom hook for managing paginated message history with infinite scroll
 * @param {string} tripId - Trip ID
 * @returns {object} Messages, loading state, and pagination utilities
 */
const usePaginatedMessages = (tripId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const initialLoadDone = useRef(false);

  // Load initial messages (latest 10)
  const loadInitialMessages = useCallback(async () => {
    if (!tripId || initialLoadDone.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await messageApi.getMessages(tripId, { limit: 10 });

      // Messages come in DESC order from server, reverse for chat display
      const sortedMessages = [...response.messages].reverse();

      setMessages(sortedMessages);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
      initialLoadDone.current = true;
    } catch (err) {
      console.error("Failed to load initial messages:", err);
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Load older messages (for infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!tripId || !hasMore || loading || !nextCursor) return;

    setLoading(true);
    setError(null);

    try {
      const response = await messageApi.getMessages(tripId, {
        limit: 10,
        before: nextCursor,
      });

      // Messages come in DESC order, reverse and prepend to existing
      const sortedMessages = [...response.messages].reverse();

      setMessages((prev) => [...sortedMessages, ...prev]);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err) {
      console.error("Failed to load more messages:", err);
      setError(err.message || "Failed to load more messages");
    } finally {
      setLoading(false);
    }
  }, [tripId, hasMore, loading, nextCursor]);

  // Add new message (from socket)
  const addMessage = useCallback((message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m._id === message._id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  // Add optimistic message (before server confirmation)
  const addOptimisticMessage = useCallback((tempMessage) => {
    setMessages((prev) => [...prev, tempMessage]);
  }, []);

  // Update message after server confirmation
  const updateMessage = useCallback((tempId, confirmedMessage) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.tempId === tempId ? confirmedMessage : msg))
    );
  }, []);

  // Load initial messages on mount
  useEffect(() => {
    if (tripId) {
      loadInitialMessages();
    }

    return () => {
      // Reset on unmount
      initialLoadDone.current = false;
      setMessages([]);
      setHasMore(true);
      setNextCursor(null);
    };
  }, [tripId, loadInitialMessages]);

  return {
    messages,
    loading,
    hasMore,
    error,
    loadMoreMessages,
    addMessage,
    addOptimisticMessage,
    updateMessage,
  };
};

export default usePaginatedMessages;
