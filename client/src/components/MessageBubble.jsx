import { format } from 'date-fns';
import Avatar from './Avatar';

/**
 * MessageBubble component - displays a single chat message
 * @param {Object} message - Message object with sender, text, and createdAt
 * @param {boolean} isOwnMessage - Whether the message is from the current user
 */
const MessageBubble = ({ message, isOwnMessage }) => {
  const formattedTime = format(new Date(message.createdAt), 'h:mm a');

  return (
    <div className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar name={message.sender?.name || 'Unknown'} size="sm" />
      </div>

      {/* Message content */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender name (only show for other users' messages) */}
        {!isOwnMessage && (
          <span className="text-xs text-gray-600 mb-1 px-1">
            {message.sender?.name || 'Unknown'}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`
            rounded-lg px-4 py-2 break-words
            ${isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Timestamp */}
        <span className={`text-xs text-gray-500 mt-1 px-1`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
