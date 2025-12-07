import express from 'express';
import {
  createItemController,
  toggleItemController,
  deleteItemController,
  getChecklistController,
} from '#controllers/checklist.controller.js';
import { authenticateToken, isTripMember } from '#middlewares/auth.middleware.js';

const router = express.Router();

// All checklist routes require authentication
router.use(authenticateToken);

// Get all checklist items for a trip (member only)
router.get('/trips/:tripId/checklist', isTripMember, getChecklistController);

// Create a new checklist item for a trip (member only)
router.post('/trips/:tripId/checklist', isTripMember, createItemController);

// Toggle checklist item checked status (member only)
router.patch('/checklist/:itemId/toggle', toggleItemController);

// Delete a checklist item (member only)
router.delete('/checklist/:itemId', deleteItemController);

export default router;
