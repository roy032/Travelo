import { useState } from "react";
import { Edit2, Trash2, Lock, Users } from "lucide-react";
import Card from "../../ui/Card";

/**
 * NoteCard component - displays a note preview with actions
 */
const NoteCard = ({ note, currentUserId, onEdit, onDelete, canEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const creatorId = note.creator?._id || note.creator?.id || note.creator;
  const isCreator = creatorId === currentUserId;
  const isPrivate = note.visibility === "private";

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(note._id || note.id);
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Truncate content for preview
  const truncateContent = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const creatorName = note.creator?.name || "Unknown";
  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Card
      padding='md'
      hover={true}
      onClick={() => onEdit(note)}
      className='cursor-pointer'
    >
      <div className='space-y-3'>
        {/* Header with title and visibility */}
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <h3 className='text-lg font-semibold text-gray-900 truncate'>
              {note.title || "Untitled Note"}
            </h3>
          </div>
          <div className='flex items-center space-x-2 ml-2'>
            {/* Visibility indicator */}
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                isPrivate
                  ? "bg-gray-100 text-gray-700"
                  : "bg-blue-100 text-blue-700"
              }`}
              title={isPrivate ? "Private note" : "Shared with all members"}
            >
              {isPrivate ? (
                <>
                  <Lock size={12} />
                  <span>Private</span>
                </>
              ) : (
                <>
                  <Users size={12} />
                  <span>Shared</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content preview */}
        <p className='text-gray-600 text-sm line-clamp-3'>
          {truncateContent(note.content)}
        </p>

        {/* Footer with metadata and actions */}
        <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
          <div className='text-xs text-gray-500'>
            <span className='font-medium'>{creatorName}</span>
            {formattedDate && <span> • {formattedDate}</span>}
          </div>

          {/* Action buttons - only show if user is creator */}
          {canEdit && isCreator && (
            <div className='flex items-center space-x-1'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                className='p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors'
                title='Edit note'
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className='p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50'
                title='Delete note'
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default NoteCard;
