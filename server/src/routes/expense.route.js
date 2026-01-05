import express from 'express';
import {
  createExpenseController,
  updateExpenseController,
  deleteExpenseController,
  getExpensesController,
  getSplitsController,
} from '#controllers/expense.controller.js';
import { authenticateToken, isTripMember } from '#middlewares/auth.middleware.js';
import { uploadReceipt, handleUploadError } from '#middlewares/upload.middleware.js';

const router = express.Router();

// All expense routes require authentication
router.use(authenticateToken);

// Get expense splits for a trip (member only) - must come before :expenseId route
router.get('/trips/:tripId/expenses/splits', isTripMember, getSplitsController);

// Get all expenses for a trip (member only)
router.get('/trips/:tripId/expenses', isTripMember, getExpensesController);

// Create a new expense (member only) - with optional receipt upload
router.post(
  '/trips/:tripId/expenses',
  isTripMember,
  uploadReceipt,
  handleUploadError,
  createExpenseController
);

// Update an expense (member only) - with optional receipt upload
router.put(
  '/trips/:tripId/expenses/:expenseId',
  isTripMember,
  uploadReceipt,
  handleUploadError,
  updateExpenseController
);

// Delete an expense (member only)
router.delete('/trips/:tripId/expenses/:expenseId', isTripMember, deleteExpenseController);

export default router;
