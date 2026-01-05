import express from 'express';
import { getMessagesController } from '#controllers/chat.controller.js';
import { authenticateToken, isTripMember } from '#middlewares/auth.middleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

// Get all messages for a trip (chat history) - member only
router.get('/trips/:tripId/messages', isTripMember, getMessagesController);

export default router;
