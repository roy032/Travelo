import {
  createExpenseSchema,
  updateExpenseSchema,
} from "#validations/expense.validation.js";
import { formatValidationError } from "#utils/format.js";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByTrip,
} from "#services/expense.service.js";
import { calculateSplits } from "#services/split.service.js";
import { utapi } from "#config/uploadthing.config.js";

/**
 * Create a new expense
 */
export const createExpenseController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Convert string values from FormData to proper types
    const bodyData = { ...req.body };
    if (bodyData.amount) {
      bodyData.amount = parseFloat(bodyData.amount);
    }

    const validationResult = createExpenseSchema.safeParse(bodyData);

    console.log(tripId);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { amount, currency, category, description, payer } =
      validationResult.data;

    const expenseData = {
      trip: tripId,
      amount,
      currency,
      category,
      description,
      payer,
      creator: req.user.id, // From authentication middleware
    };

    // Add receipt information if file was uploaded
    if (req.file) {
      try {
        // Upload file to UploadThing
        const uploadedFile = await utapi.uploadFiles(
          new File([req.file.buffer], req.file.originalname, {
            type: req.file.mimetype,
          })
        );

        if (uploadedFile.data) {
          expenseData.receipt = {
            filename: uploadedFile.data.name,
            key: uploadedFile.data.key,
            url: uploadedFile.data.url,
            uploadedAt: new Date(),
          };
        }
      } catch (uploadError) {
        console.error("Receipt upload error:", uploadError);
        return res.status(500).json({
          error: "Upload failed",
          message: "Failed to upload receipt",
        });
      }
    }

    const expense = await createExpense(expenseData);

    res.status(201).json({
      message: "Expense created successfully",
      expense,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Payer must be a member of the trip") {
      return res.status(400).json({
        error: "Validation failed",
        message: "Payer must be a member of the trip",
      });
    }

    next(e);
  }
};

/**
 * Update an existing expense
 */
export const updateExpenseController = async (req, res, next) => {
  try {
    const { tripId, expenseId } = req.params;

    // Convert string values from FormData to proper types
    const bodyData = { ...req.body };
    if (bodyData.amount) {
      bodyData.amount = parseFloat(bodyData.amount);
    }

    const validationResult = updateExpenseSchema.safeParse(bodyData);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const updateData = { ...validationResult.data };

    // Add receipt information if file was uploaded
    if (req.file) {
      try {
        // Upload file to UploadThing
        const uploadedFile = await utapi.uploadFiles(
          new File([req.file.buffer], req.file.originalname, {
            type: req.file.mimetype,
          })
        );

        if (uploadedFile.data) {
          updateData.receipt = {
            filename: uploadedFile.data.name,
            key: uploadedFile.data.key,
            url: uploadedFile.data.url,
            uploadedAt: new Date(),
          };
        }
      } catch (uploadError) {
        console.error("Receipt upload error:", uploadError);
        return res.status(500).json({
          error: "Upload failed",
          message: "Failed to upload receipt",
        });
      }
    }

    const expense = await updateExpense(expenseId, req.user.id, updateData);

    res.status(200).json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (e) {
    if (e.message === "Expense not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Expense not found",
      });
    }

    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Payer must be a member of the trip") {
      return res.status(400).json({
        error: "Validation failed",
        message: "Payer must be a member of the trip",
      });
    }

    next(e);
  }
};

/**
 * Delete an expense
 */
export const deleteExpenseController = async (req, res, next) => {
  try {
    const { tripId, expenseId } = req.params;

    const result = await deleteExpense(expenseId, req.user.id);

    res.status(200).json(result);
  } catch (e) {
    if (e.message === "Expense not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Expense not found",
      });
    }

    next(e);
  }
};

/**
 * Get all expenses for a trip
 */
export const getExpensesController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const expenses = await getExpensesByTrip(tripId, req.user.id);

    res.status(200).json({
      expenses,
      count: expenses.length,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Access denied: You are not a member of this trip") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not a member of this trip",
      });
    }

    next(e);
  }
};

/**
 * Get expense splits for a trip
 */
export const getSplitsController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const splits = await calculateSplits(tripId, req.user.id);

    res.status(200).json(splits);
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Access denied: You are not a member of this trip") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not a member of this trip",
      });
    }

    next(e);
  }
};
