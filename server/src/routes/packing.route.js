import express from 'express';
import {
  getPackingSuggestions,
  addSuggestionsToChecklist,
} from '#controllers/packing.controller.js';
import { authenticateToken, isTripMember } from '#middlewares/auth.middleware.js';

const router = express.Router();

// All packing routes require authentication
router.use(authenticateToken);

// Get packing suggestions for a trip (member only)
router.get('/trips/:tripId/packing-suggestions', isTripMember, getPackingSuggestions);

// Add packing suggestions to trip checklist (member only)
router.post('/trips/:tripId/packing-suggestions/add-to-checklist', isTripMember, addSuggestionsToChecklist);

export default router;
