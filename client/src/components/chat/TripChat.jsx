import { useEffect, useState, useCallback } from "react";
import useSocket from "../../hooks/useSocket";
import usePaginatedMessages from "../../hooks/usePaginatedMessages";
import { useAuth } from "../../hooks/useAuth";
import ChatHistory from "./ChatHistory";
import MessageInput from "./MessageInput";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import { MessageCircle, WifiOff, Wifi } from "lucide-react";
import toast from "react-hot-toast";

/**
 * TripChat - Main chat component for a trip
 * @param {string} tripId - Trip ID
 */
const TripChat = ({ tripId }) => {
  const { user } = useAuth();
  const {
    isConnected,
    isJoined,
    error: socketError,
    sendMessage,
    onNewMessage,
  } = useSocket(tripId);

  const {
    messages,
    loading,
    hasMore,
    error: messagesError,
    loadMoreMessages,
    addMessage,
    addOptimisticMessage,
    updateMessage,
  } = usePaginatedMessages(tripId);

  const [optimisticMessages, setOptimisticMessages] = useState([]);

  // Subscribe to new messages from socket
  useEffect(() => {
    if (!isJoined) return;

    const unsubscribe = onNewMessage((message) => {
      console.log("New message received:", message);

      // Add confirmed message
      addMessage(message);
    });

    return unsubscribe;
  }, [isJoined, onNewMessage, addMessage]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (text) => {
      if (!isConnected || !isJoined) {
        toast.error("Not connected to chat");
        return;
      }

      // Create optimistic message
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg = {
        tempId,
        text,
        sender: {
          _id: user?.id,
          name: user?.name,
        },
        createdAt: new Date().toISOString(),
      };

      // Add to optimistic messages
      setOptimisticMessages((prev) => [...prev, optimisticMsg]);

      // Send via socket
      sendMessage(text, (response) => {
        if (response?.error) {
          console.error("Failed to send message:", response.error);
          toast.error(response.error);

          // Remove optimistic message on error
          setOptimisticMessages((prev) =>
            prev.filter((msg) => msg.tempId !== tempId)
          );
        } else {
          console.log("Message sent successfully:", response);
          // Remove optimistic message on success - the real message will come via socket
          setOptimisticMessages((prev) =>
            prev.filter((msg) => msg.tempId !== tempId)
          );
        }
      });
    },
    [isConnected, isJoined, sendMessage]
  );

  // Show connection errors
  useEffect(() => {
    if (socketError) {
      toast.error(`Connection error: ${socketError}`);
    }
  }, [socketError]);

  useEffect(() => {
    if (messagesError) {
      toast.error(`Failed to load messages: ${messagesError}`);
    }
  }, [messagesError]);

  return (
    <Card className='flex flex-col h-[600px] '>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b bg-gray-50'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='w-5 h-5 text-blue-500' />
          <h3 className='font-semibold text-gray-900'>Trip Chat</h3>
        </div>

        {/* Connection status */}
        <div className='flex items-center gap-2'>
          {isConnected && isJoined ? (
            <Badge color='green' size='sm' className='flex items-center gap-1'>
              <Wifi className='w-3 h-3' />
              Connected
            </Badge>
          ) : (
            <Badge color='gray' size='sm' className='flex items-center gap-1'>
              <WifiOff className='w-3 h-3' />
              {isConnected ? "Joining..." : "Connecting..."}
            </Badge>
          )}
        </div>
      </div>

      {/* Chat history */}
      <ChatHistory
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        optimisticMessages={optimisticMessages}
      />

      {/* Message input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={!isConnected || !isJoined}
      />
    </Card>
  );
};

export default TripChat;
