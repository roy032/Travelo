import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, notFoundHandler } from './error.middleware.js';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  FileUploadError,
} from '#errors/AppError.js';

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/api/test',
      method: 'GET',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    // Suppress console.error during tests
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  describe('errorHandler', () => {
    it('should handle ValidationError (400)', () => {
      const error = new ValidationError('Invalid input', [
        { field: 'email', message: 'Invalid email format' },
      ]);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input',
        details: [{ field: 'email', message: 'Invalid email format' }],
      });
    });

    it('should handle AuthenticationError (401)', () => {
      const error = new AuthenticationError('Token expired');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Token expired',
      });
    });

    it('should handle AuthorizationError (403)', () => {
      const error = new AuthorizationError('Insufficient permissions');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'Insufficient permissions',
      });
    });

    it('should handle NotFoundError (404)', () => {
      const error = new NotFoundError('Trip not found');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    });

    it('should handle ConflictError (409)', () => {
      const error = new ConflictError('Email already exists');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Conflict',
        message: 'Email already exists',
      });
    });

    it('should handle MongoDB duplicate key error (11000)', () => {
      const error = {
        code: 11000,
        keyPattern: { email: 1 },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Conflict',
        message: 'email already exists',
      });
    });

    it('should handle MongoDB CastError', () => {
      const error = {
        name: 'CastError',
        path: 'id',
        value: 'invalid-id',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid id: invalid-id',
      });
    });

    it('should handle JWT JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'jwt malformed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Invalid token',
      });
    });

    it('should handle JWT TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Token expired',
      });
    });

    it('should handle Multer LIMIT_FILE_SIZE error', () => {
      const error = {
        name: 'MulterError',
        code: 'LIMIT_FILE_SIZE',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Upload failed',
        message: 'File size exceeds the allowed limit',
      });
    });

    it('should handle file type validation error', () => {
      const error = new Error('Invalid file type: only JPEG and PNG allowed');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Upload failed',
        message: 'Invalid file type: only JPEG and PNG allowed',
      });
    });

    it('should handle unknown errors as 500', () => {
      const error = new Error('Something went wrong');
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Something went wrong',
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for undefined routes', () => {
      notFoundHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Resource not found',
        message: 'Route GET /api/test not found',
      });
    });
  });
});
