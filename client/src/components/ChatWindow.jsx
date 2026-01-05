import { useState, useEffect, useRef, useCallback } from "react";
import { chatApi } from "../services/api.service";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import Loader from "./Loader";
import toast from "react-hot-toast";

/**
 * ChatWindow component - Real-time chat with scroll pagination
 *
 * Features:
 * - Auto-connects when user enters the page
 * - Loads 10 previous messages initially
 * - Scroll pagination to load older messages
 * - Real-time messaging with Socket.IO
 * - User join/leave notifications
 *
 * @param {string} tripId - Trip ID for the chat
 */
const ChatWindow = ({ tripId }) => {
  const { user } = useAuth();
  const {
    isConnected,
    connect,
    joinTrip,
    leaveTrip,
    sendMessage,
    onNewMessage,
    offNewMessage,
    onJoinedTrip,
    offJoinedTrip,
    onUserJoinedRoom,
    offUserJoinedRoom,
    onUserLeftRoom,
    offUserLeftRoom,
    onError,
    offError,
  } = useSocket();

  // State management
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [roomStatus, setRoomStatus] = useState("disconnected"); // 'disconnected', 'connecting', 'joining', 'joined'

  // Refs for scroll management and connection tracking
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousScrollHeightRef = useRef(0);
  const isJoinedRef = useRef(false);
  const connectionInitializedRef = useRef(false);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle scroll events - detect when to load more and manage auto-scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Enable auto-scroll if user is near bottom
    setShouldAutoScroll(distanceFromBottom < 100);

    // Load more messages when scrolled near top
    if (scrollTop < 100 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [loadingMore, hasMore]);

  // Load more messages (older messages) with pagination
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;

    try {
      setLoadingMore(true);

      // Get the oldest message ID as the 'before' cursor
      const oldestMessageId = messages[0].id || messages[0]._id;

      // Store current scroll height to maintain scroll position
      if (messagesContainerRef.current) {
        previousScrollHeightRef.current =
          messagesContainerRef.current.scrollHeight;
      }

      const data = await chatApi.getMessages(tripId, {
        limit: 10,
        before: oldestMessageId,
      });

      // Prepend older messages to the beginning
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast.error("Failed to load older messages");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, messages, tripId]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (loadingMore || !messagesContainerRef.current) return;

    const currentScrollHeight = messagesContainerRef.current.scrollHeight;
    const previousScrollHeight = previousScrollHeightRef.current;

    if (
      previousScrollHeight > 0 &&
      currentScrollHeight > previousScrollHeight
    ) {
      // Maintain scroll position by adjusting for the new content
      messagesContainerRef.current.scrollTop =
        currentScrollHeight - previousScrollHeight;
    }
  }, [messages, loadingMore]);

  // Load initial chat history (latest 10 messages)
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        setConnectionError(null);
        const data = await chatApi.getMessages(tripId, { limit: 10 });
        setMessages(data.messages || []);
        setHasMore(data.hasMore || false);
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Failed to load chat history");
        setConnectionError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      loadMessages();
    }
  }, [tripId]);

  // Auto-connect when user enters the chat window
  useEffect(() => {
    if (!user || !tripId || connectionInitializedRef.current) return;

    console.log(
      `[ChatWindow] User ${user.id} entering chat for trip ${tripId}`
    );
    console.log("[ChatWindow] Initiating socket connection...");

    connectionInitializedRef.current = true;
    setConnectionError(null);
    setRoomStatus("connecting");

    // Establish socket connection
    connect();

    // Cleanup function
    return () => {
      console.log("[ChatWindow] Component unmounting");
      connectionInitializedRef.current = false;
      setRoomStatus("disconnected");
    };
  }, [user, tripId, connect]);

  // Join trip room when socket connection is established
  useEffect(() => {
    if (!isConnected || !tripId || isJoinedRef.current) return;

    console.log(`[ChatWindow] Socket connected. Joining trip room: ${tripId}`);
    setRoomStatus("joining");

    try {
      // Request to join the trip room
      joinTrip(tripId);
      console.log(`[ChatWindow] Join request sent for trip room: ${tripId}`);
    } catch (error) {
      console.error("[ChatWindow] Error sending join request:", error);
      setConnectionError("Failed to join chat room");
      setRoomStatus("disconnected");
      toast.error("Failed to join chat room");
    }

    // Leave trip room on cleanup
    return () => {
      if (isJoinedRef.current && tripId) {
        console.log(`[ChatWindow] Leaving trip room: ${tripId}`);
        try {
          leaveTrip(tripId);
          isJoinedRef.current = false;
          setRoomStatus("disconnected");
        } catch (error) {
          console.error("[ChatWindow] Error leaving trip room:", error);
        }
      }
    };
  }, [isConnected, tripId, joinTrip, leaveTrip]);

  // Listen for joinedTrip confirmation from server
  useEffect(() => {
    if (!isConnected) return;

    const handleJoinedTrip = (data) => {
      console.log(`[ChatWindow] Successfully joined trip room:`, data);
      isJoinedRef.current = true;
      setRoomStatus("joined");
      setConnectionError(null);
      toast.success("Connected to chat room");
    };

    console.log("[ChatWindow] Registering joinedTrip listener");
    onJoinedTrip(handleJoinedTrip);

    return () => {
      console.log("[ChatWindow] Removing joinedTrip listener");
      offJoinedTrip(handleJoinedTrip);
    };
  }, [isConnected, onJoinedTrip, offJoinedTrip]);

  // Listen for users joining/leaving the room
  useEffect(() => {
    if (!isConnected || !isJoinedRef.current) return;

    const handleUserJoinedRoom = (data) => {
      console.log(`[ChatWindow] User joined room:`, data);
      toast.success(`${data.userEmail} joined the chat`, {
        duration: 2000,
        icon: "👋",
      });
    };

    const handleUserLeftRoom = (data) => {
      console.log(`[ChatWindow] User left room:`, data);
      const reason =
        data.reason === "disconnected" ? "disconnected from" : "left";
      toast(`${data.userEmail} ${reason} the chat`, {
        duration: 2000,
        icon: "👋",
      });
    };

    console.log("[ChatWindow] Registering user join/leave listeners");
    onUserJoinedRoom(handleUserJoinedRoom);
    onUserLeftRoom(handleUserLeftRoom);

    return () => {
      console.log("[ChatWindow] Removing user join/leave listeners");
      offUserJoinedRoom(handleUserJoinedRoom);
      offUserLeftRoom(handleUserLeftRoom);
    };
  }, [
    isConnected,
    onUserJoinedRoom,
    offUserJoinedRoom,
    onUserLeftRoom,
    offUserLeftRoom,
  ]);

  // Listen for new messages and errors from socket
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (message) => {
      console.log("[ChatWindow] New message received:", message);
      setMessages((prev) => {
        // Prevent duplicate messages
        const isDuplicate = prev.some(
          (msg) => (msg.id || msg._id) === (message.id || message._id)
        );
        if (isDuplicate) {
          console.log("[ChatWindow] Duplicate message detected, ignoring");
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleSocketError = (error) => {
      console.error("[ChatWindow] Socket error:", error);
      setConnectionError(error.message || "Chat error occurred");
      setRoomStatus("disconnected");
      toast.error(error.message || "Chat connection error");
    };

    console.log("[ChatWindow] Registering message and error listeners");
    onNewMessage(handleNewMessage);
    onError(handleSocketError);

    return () => {
      console.log("[ChatWindow] Removing message and error listeners");
      offNewMessage(handleNewMessage);
      offError(handleSocketError);
    };
  }, [isConnected, onNewMessage, offNewMessage, onError, offError]);

  // Auto-scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  // Initial scroll to bottom after loading
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [loading, scrollToBottom]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    (text) => {
      if (!isConnected || !isJoinedRef.current) {
        toast.error("Not connected to chat. Please wait or refresh the page.");
        return;
      }

      if (!text.trim()) {
        return;
      }

      console.log(`[ChatWindow] Sending message to trip ${tripId}:`, text);

      try {
        sendMessage(tripId, text);
      } catch (error) {
        console.error("[ChatWindow] Error sending message:", error);
        toast.error("Failed to send message");
      }
    },
    [isConnected, tripId, sendMessage]
  );

  // Render loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Loader />
      </div>
    );
  }

  return (
    <div className='flex flex-col h-[600px]'>
      {/* Connection status indicators */}
      {connectionError && (
        <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-2 text-sm rounded-lg mb-4 flex items-center justify-between'>
          <span>{connectionError}</span>
          <button
            onClick={() => {
              connectionInitializedRef.current = false;
              isJoinedRef.current = false;
              setRoomStatus("connecting");
              connect();
            }}
            className='text-red-600 hover:text-red-800 underline ml-2'
          >
            Retry
          </button>
        </div>
      )}

      {roomStatus === "connecting" && !connectionError && (
        <div className='bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 text-sm rounded-lg mb-4 flex items-center'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-800 mr-2'></div>
          <span>Connecting to server...</span>
        </div>
      )}

      {roomStatus === "joining" && !connectionError && (
        <div className='bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 text-sm rounded-lg mb-4 flex items-center'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2'></div>
          <span>Joining chat room...</span>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4'
      >
        {/* Loading more indicator */}
        {loadingMore && (
          <div className='flex justify-center py-2'>
            <Loader size='sm' />
          </div>
        )}

        {/* Load more indicator */}
        {hasMore && !loadingMore && messages.length > 0 && (
          <div className='flex justify-center py-2'>
            <p className='text-xs text-gray-500'>
              Scroll up to load older messages
            </p>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 ? (
          <div className='flex items-center justify-center h-full'>
            <p className='text-gray-500 text-center'>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {/* Render messages */}
            {messages.map((message) => (
              <MessageBubble
                key={message.id || message._id}
                message={message}
                isOwnMessage={
                  message.sender?._id === user?.id ||
                  message.sender?.id === user?.id ||
                  message.sender === user?.id
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected || !isJoinedRef.current}
      />
    </div>
  );
};

export default ChatWindow;
