import express from 'express';
import {
  getDestinationsController,
  getDestinationByIdController,
} from '#controllers/destination.controller.js';

const router = express.Router();

// Get all destinations with optional filtering and search
// Query parameters: category, search
router.get('/', getDestinationsController);

// Get a specific destination by ID
router.get('/:destinationId', getDestinationByIdController);

export default router;
