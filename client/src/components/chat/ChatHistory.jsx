import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import Loader from "../ui/Loader";
import { ChevronDown } from "lucide-react";

/**
 * ChatHistory - Scrollable message list with infinite scroll
 * @param {array} messages - Array of message objects
 * @param {boolean} loading - Whether messages are loading
 * @param {boolean} hasMore - Whether more messages are available
 * @param {function} onLoadMore - Callback to load more messages
 * @param {array} optimisticMessages - Temporary messages being sent
 */
const ChatHistory = ({
  messages,
  loading,
  hasMore,
  onLoadMore,
  optimisticMessages = [],
}) => {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevMessagesLength = useRef(messages.length);

  // Scroll to bottom helper
  const scrollToBottom = (behavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && autoScroll) {
      scrollToBottom("smooth");
    }
    prevMessagesLength.current = messages.length;
  }, [messages, autoScroll]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && prevMessagesLength.current === 0) {
      setTimeout(() => scrollToBottom("auto"), 100);
    }
  }, [messages.length]);

  // Infinite scroll observer for top sentinel
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          // Save current scroll position
          const container = containerRef.current;
          const oldScrollHeight = container.scrollHeight;
          const oldScrollTop = container.scrollTop;

          // Load more messages
          onLoadMore?.();

          // Restore scroll position after messages load
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - oldScrollHeight;
            container.scrollTop = oldScrollTop + scrollDiff;
          }, 100);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollButton(!isNearBottom);
    setAutoScroll(isNearBottom);
  };

  // Combine real and optimistic messages
  const allMessages = [...messages, ...optimisticMessages];

  if (messages.length === 0 && !loading) {
    return (
      <div className='flex-1 flex items-center justify-center text-gray-500 p-8'>
        <div className='text-center'>
          <p className='text-lg font-medium mb-2'>No messages yet</p>
          <p className='text-sm'>Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className='relative flex-1 flex flex-col overflow-y-scroll overflow-x-hidden'>
      {/* Scrollable message container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto px-4 py-4'
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Top sentinel for infinite scroll */}
        {hasMore && <div ref={sentinelRef} className='h-1' />}

        {/* Loading indicator at top */}
        {loading && hasMore && (
          <div className='flex justify-center py-4'>
            <Loader />
          </div>
        )}

        {/* Messages */}
        {allMessages.map((message, index) => {
          const isOptimistic = message.tempId != null;
          return (
            <MessageBubble
              key={message._id || message.tempId || index}
              message={message}
              isOptimistic={isOptimistic}
            />
          );
        })}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className='absolute bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors'
          aria-label='Scroll to bottom'
        >
          <ChevronDown className='w-5 h-5' />
        </button>
      )}
    </div>
  );
};

export default ChatHistory;
