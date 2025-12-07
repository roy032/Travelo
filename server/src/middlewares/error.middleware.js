import { AppError } from '#errors/AppError.js';
import { formatValidationError } from '#utils/format.js';

/**
 * Centralized error handling middleware
 * This should be registered as the last middleware in the Express app
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Handle operational errors (known errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.error || 'Error',
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: formatValidationError(err),
    });
  }

  // Handle MongoDB duplicate key errors (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: 'Conflict',
      message: `${field} already exists`,
    });
  }

  // Handle MongoDB cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Token expired',
    });
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Upload failed',
        message: 'File size exceeds the allowed limit',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Upload failed',
        message: 'Unexpected field in file upload',
      });
    }
    return res.status(400).json({
      error: 'Upload failed',
      message: err.message,
    });
  }

  // Handle file type validation errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(415).json({
      error: 'Upload failed',
      message: err.message,
    });
  }

  // Handle unknown/unexpected errors (500)
  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
  });
};

/**
 * Catch-all handler for undefined routes (404)
 * This should be registered before the error handler
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Resource not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
