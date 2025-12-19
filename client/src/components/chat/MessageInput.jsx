import { useState, useRef } from "react";
import Button from "../ui/Button";
import { Send, Loader2 } from "lucide-react";

/**
 * MessageInput - Text input for sending messages
 * @param {function} onSend - Callback when message is sent
 * @param {boolean} disabled - Whether input is disabled
 */
const MessageInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText || sending || disabled) return;

    setSending(true);
    setText(""); // Clear immediately for better UX

    try {
      await onSend(trimmedText);
    } catch (error) {
      // Restore text on error
      setText(trimmedText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex items-end gap-2 p-4 border-t bg-white'
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Not connected..." : "Type a message..."}
        disabled={disabled || sending}
        rows={1}
        maxLength={2000}
        className='flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32 overflow-y-auto'
        style={{ minHeight: "42px" }}
      />

      <Button
        type='submit'
        disabled={!text.trim() || disabled || sending}
        size='md'
        className='shrink-0'
      >
        {sending ? (
          <Loader2 className='w-5 h-5 animate-spin' />
        ) : (
          <Send className='w-5 h-5' />
        )}
      </Button>
    </form>
  );
};

export default MessageInput;
