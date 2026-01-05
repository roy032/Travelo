import { format } from "date-fns";
import { useAuth } from "../../hooks/useAuth";

/**
 * MessageBubble - Display a single chat message
 * @param {object} message - Message object
 * @param {boolean} isOptimistic - Whether this is an optimistic message
 */
const MessageBubble = ({ message, isOptimistic = false }) => {
  const { user } = useAuth();
  const isOwnMessage =
    message.sender?._id === user?.id || message.sender === user?.id;

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`flex mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[70%] ${
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        {!isOwnMessage && (
          <div className='shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium mr-2'>
            {message.sender?.name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}

        {/* Message content */}
        <div>
          {/* Sender name (only for others' messages) */}
          {!isOwnMessage && (
            <div className='text-xs text-gray-600 mb-1 px-1'>
              {message.sender?.name || "Unknown"}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? "bg-blue-500 text-white rounded-tr-sm"
                : "bg-gray-200 text-gray-900 rounded-tl-sm"
            } ${isOptimistic ? "opacity-60" : ""}`}
          >
            <p className='text-sm whitespace-pre-wrap word-break-words'>
              {message.text}
            </p>
          </div>

          {/* Timestamp */}
          <div
            className={`text-xs text-gray-500 mt-1 px-1 ${
              isOwnMessage ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.createdAt)}
            {isOptimistic && <span className='ml-1 italic'>(sending...)</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
