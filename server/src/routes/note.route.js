import express from 'express';
import {
  createNoteController,
  updateNoteController,
  deleteNoteController,
  getNotesController,
} from '#controllers/note.controller.js';
import { authenticateToken, isTripMember } from '#middlewares/auth.middleware.js';

const router = express.Router();

// All note routes require authentication
router.use(authenticateToken);

// Get all notes for a trip (member only)
router.get('/trips/:tripId/notes', isTripMember, getNotesController);

// Create a new note for a trip (member only)
router.post('/trips/:tripId/notes', isTripMember, createNoteController);

// Update a note (creator only - enforced in controller)
router.patch('/notes/:noteId', updateNoteController);

// Delete a note (creator only - enforced in controller)
router.delete('/notes/:noteId', deleteNoteController);

export default router;
