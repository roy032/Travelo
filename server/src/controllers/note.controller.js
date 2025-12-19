import { createNoteSchema, updateNoteSchema } from '#validations/note.validation.js';
import { formatValidationError } from '#utils/format.js';
import {
  createNote,
  updateNote,
  deleteNote,
  getNotesByTrip,
} from '#services/note.service.js';
import Notification from '#models/notification.model.js';
import Trip from '#models/trip.model.js';

/**
 * Create a new note
 */
export const createNoteController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const validationResult = createNoteSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { title, content, visibility } = validationResult.data;

    const noteData = {
      trip: tripId,
      title,
      content,
      visibility,
      creator: req.user.id, // From authentication middleware
    };

    const note = await createNote(noteData);

    // Create notifications for shared notes only
    if (visibility === 'shared') {
      // Get all trip members for notifications
      const trip = await Trip.findById(tripId).populate('members', '_id');

      if (trip) {
        // Create notifications for all trip members except the creator
        const notifications = trip.members
          .filter((member) => member._id.toString() !== req.user.id.toString())
          .map((member) => ({
            user: member._id,
            type: 'activity_added',
            title: 'New Shared Note',
            message: `A new shared note "${title || 'Untitled'}" has been created`,
            relatedTrip: tripId,
            relatedResource: note.id,
          }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    res.status(201).json({
      message: 'Note created successfully',
      note,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Update a note
 */
export const updateNoteController = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    const validationResult = updateNoteSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const updateData = validationResult.data;

    // Check if visibility is changing from private to shared
    const Note = (await import('#models/note.model.js')).default;
    const existingNote = await Note.findById(noteId);

    const visibilityChangedToShared =
      existingNote &&
      existingNote.visibility === 'private' &&
      updateData.visibility === 'shared';

    const note = await updateNote(noteId, req.user.id, updateData);

    // Create notifications if visibility changed from private to shared
    if (visibilityChangedToShared) {
      // Get all trip members for notifications
      const trip = await Trip.findById(note.trip).populate('members', '_id');

      if (trip) {
        // Create notifications for all trip members except the creator
        const notifications = trip.members
          .filter((member) => member._id.toString() !== req.user.id.toString())
          .map((member) => ({
            user: member._id,
            type: 'activity_added',
            title: 'Note Shared',
            message: `A note "${note.title || 'Untitled'}" has been shared with the trip`,
            relatedTrip: note.trip,
            relatedResource: note.id,
          }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    res.status(200).json({
      message: 'Note updated successfully',
      note,
    });
  } catch (e) {
    if (e.message === 'Note not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Note not found',
      });
    }

    if (e.message === 'Access denied: Only the note creator can update this note') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the note creator can update this note',
      });
    }

    next(e);
  }
};

/**
 * Delete a note
 */
export const deleteNoteController = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    const result = await deleteNote(noteId, req.user.id);

    res.status(200).json(result);
  } catch (e) {
    if (e.message === 'Note not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Note not found',
      });
    }

    if (e.message === 'Access denied: Only the note creator can delete this note') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the note creator can delete this note',
      });
    }

    next(e);
  }
};

/**
 * Get all notes for a trip
 */
export const getNotesController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const notes = await getNotesByTrip(tripId, req.user.id);

    res.status(200).json({
      notes,
      count: notes.length,
    });
  } catch (e) {
    if (e.message === 'Trip not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    }

    if (e.message === 'Access denied: You are not a member of this trip') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this trip',
      });
    }

    next(e);
  }
};
