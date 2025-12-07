import { useState, useEffect } from 'react';
import { notesApi } from '../services/api.service';
import NoteCard from './NoteCard';
import Loader from './Loader';
import { SkeletonCard } from './SkeletonLoader';
import { EmptyNotes } from './EmptyState';
import Button from './Button';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { successMessages } from '../utils/toast.config';

/**
 * NotesList component - displays notes in a grid layout
 */
const NotesList = ({ tripId, currentUserId, onAddNote, onEditNote, canEdit = true }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [tripId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await notesApi.getNotes(tripId);
      // Filter notes based on visibility
      const filteredNotes = (data.notes || data).filter((note) => {
        // Show all shared notes
        if (note.visibility === 'shared') return true;
        // Show private notes only to creator
        if (note.visibility === 'private') {
          const creatorId = note.creator?._id || note.creator?.id || note.creator;
          return creatorId === currentUserId;
        }
        return true;
      });
      setNotes(filteredNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notesApi.deleteNote(tripId, noteId);
      setNotes(notes.filter((note) => (note._id || note.id) !== noteId));
      toast.success(successMessages.deleted);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onAddNote()}
          >
            <Plus size={20} className="mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {/* Notes grid */}
      {notes.length === 0 ? (
        <EmptyNotes onCreateNote={canEdit ? () => onAddNote() : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note._id || note.id}
              note={note}
              currentUserId={currentUserId}
              onEdit={onEditNote}
              onDelete={handleDeleteNote}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;
