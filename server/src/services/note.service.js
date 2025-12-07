import Note from '#models/note.model.js';
import Trip from '#models/trip.model.js';

/**
 * Create a new note
 * @param {Object} noteData - Note creation data
 * @param {string} noteData.trip - Trip ID
 * @param {string} noteData.title - Note title (optional)
 * @param {string} noteData.content - Note content
 * @param {string} noteData.visibility - Note visibility (private or shared)
 * @param {string} noteData.creator - User ID of the creator
 * @returns {Promise<Object>} Created note object
 * @throws {Error} If validation fails
 */
export const createNote = async (noteData) => {
  try {
    const { trip, title, content, visibility, creator } = noteData;

    // Create new note
    const note = new Note({
      trip,
      title,
      content,
      visibility,
      creator,
    });

    await note.save();

    // Populate creator information
    await note.populate('creator', 'name email');

    return {
      id: note._id,
      trip: note.trip,
      title: note.title,
      content: note.content,
      visibility: note.visibility,
      creator: note.creator,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Update a note with creator validation
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID attempting to update
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated note object
 * @throws {Error} If note not found or user is not the creator
 */
export const updateNote = async (noteId, userId, updateData) => {
  try {
    // Find the note
    const note = await Note.findById(noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    // Verify user is the creator
    if (note.creator.toString() !== userId.toString()) {
      throw new Error('Access denied: Only the note creator can update this note');
    }

    // Update allowed fields
    if (updateData.title !== undefined) {
      note.title = updateData.title;
    }
    if (updateData.content !== undefined) {
      note.content = updateData.content;
    }
    if (updateData.visibility !== undefined) {
      note.visibility = updateData.visibility;
    }

    await note.save();

    // Populate creator information
    await note.populate('creator', 'name email');

    return {
      id: note._id,
      trip: note.trip,
      title: note.title,
      content: note.content,
      visibility: note.visibility,
      creator: note.creator,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Delete a note with creator validation
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID attempting to delete
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {Error} If note not found or user is not the creator
 */
export const deleteNote = async (noteId, userId) => {
  try {
    // Find the note
    const note = await Note.findById(noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    // Verify user is the creator
    if (note.creator.toString() !== userId.toString()) {
      throw new Error('Access denied: Only the note creator can delete this note');
    }

    // Delete the note
    await Note.findByIdAndDelete(noteId);

    return {
      message: 'Note deleted successfully',
      noteId,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all notes for a trip with visibility filtering
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the notes
 * @returns {Promise<Array>} Array of note objects
 * @throws {Error} If trip not found or user is not a member
 */
export const getNotesByTrip = async (tripId, userId) => {
  try {
    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error('Access denied: You are not a member of this trip');
    }

    // Get notes for the trip with visibility filtering
    // User can see:
    // 1. All shared notes
    // 2. Their own private notes
    const notes = await Note.find({
      trip: tripId,
      $or: [
        { visibility: 'shared' },
        { visibility: 'private', creator: userId },
      ],
    })
      .populate('creator', 'name email')
      .sort({ createdAt: -1 }); // Sort by creation date descending (newest first)

    return notes.map((note) => ({
      id: note._id,
      trip: note.trip,
      title: note.title,
      content: note.content,
      visibility: note.visibility,
      creator: note.creator,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  } catch (e) {
    throw e;
  }
};
