# Error Handling Guide

This document explains how to use the centralized error handling system in the travel planner application.

## Overview

The application uses a centralized error handling middleware that automatically handles different types of errors and returns consistent error responses to clients.

## Error Classes

Custom error classes are available in `src/errors/AppError.js`:

### ValidationError (400)
Used for input validation failures.

```javascript
import { ValidationError } from '#errors/AppError.js';

throw new ValidationError('Invalid input', [
  { field: 'email', message: 'Invalid email format' }
]);
```

### AuthenticationError (401)
Used when authentication is required or fails.

```javascript
import { AuthenticationError } from '#errors/AppError.js';

throw new AuthenticationError('Token expired');
```

### AuthorizationError (403)
Used when a user lacks permission to perform an action.

```javascript
import { AuthorizationError } from '#errors/AppError.js';

throw new AuthorizationError('Only trip owners can delete trips');
```

### NotFoundError (404)
Used when a requested resource doesn't exist.

```javascript
import { NotFoundError } from '#errors/AppError.js';

throw new NotFoundError('Trip not found');
```

### ConflictError (409)
Used for resource conflicts (e.g., duplicate entries).

```javascript
import { ConflictError } from '#errors/AppError.js';

throw new ConflictError('Email already exists');
```

### FileUploadError (413/415)
Used for file upload failures.

```javascript
import { FileUploadError } from '#errors/AppError.js';

throw new FileUploadError('File size exceeds limit', 413);
```

## Usage in Controllers

### Using Custom Error Classes

```javascript
export const getTripController = async (req, res, next) => {
  try {
    const trip = await getTripById(req.params.tripId);
    
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }
    
    res.status(200).json({ trip });
  } catch (error) {
    next(error); // Pass error to error handler
  }
};
```

### Using Error Messages (Legacy Pattern)

The error handler also supports the legacy pattern of throwing errors with specific messages:

```javascript
export const updateTripController = async (req, res, next) => {
  try {
    const trip = await updateTrip(tripId, userId, updateData);
    res.status(200).json({ trip });
  } catch (error) {
    // These specific error messages are automatically handled
    if (error.message === 'Trip not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found'
      });
    }
    
    if (error.message === 'Only the trip owner can update trip details') {
      return res.status(403).json({
        error: 'Access denied',
        message: error.message
      });
    }
    
    next(error);
  }
};
```

## Automatic Error Handling

The error handler automatically handles:

- **Zod validation errors**: Converted to 400 with field-specific details
- **MongoDB duplicate key errors (11000)**: Converted to 409 Conflict
- **MongoDB CastError**: Converted to 400 for invalid ObjectIds
- **JWT errors**: Converted to 401 for invalid/expired tokens
- **Multer errors**: Converted to 413 for file size limits
- **File type errors**: Converted to 415 for unsupported formats
- **Unknown errors**: Converted to 500 Internal Server Error

## Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": "Error type",
  "message": "Descriptive error message",
  "details": [] // Optional, for validation errors
}
```

### Examples

**Validation Error (400)**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

**Authentication Error (401)**
```json
{
  "error": "Authentication required",
  "message": "Token expired"
}
```

**Authorization Error (403)**
```json
{
  "error": "Access denied",
  "message": "Only trip owners can delete trips"
}
```

**Not Found Error (404)**
```json
{
  "error": "Resource not found",
  "message": "Trip not found"
}
```

**Conflict Error (409)**
```json
{
  "error": "Conflict",
  "message": "Email already exists"
}
```

**Server Error (500)**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Best Practices

1. **Always use try-catch blocks** in async controllers
2. **Pass errors to next()** instead of handling them inline
3. **Use custom error classes** for better type safety and consistency
4. **Provide descriptive error messages** that help users understand what went wrong
5. **Log errors** for debugging (automatically done by error handler)
6. **Don't expose sensitive information** in error messages (e.g., stack traces in production)

## Testing

Test your error handling using the provided test utilities:

```javascript
import { describe, it, expect } from 'vitest';
import { NotFoundError } from '#errors/AppError.js';

describe('My Controller', () => {
  it('should throw NotFoundError when resource not found', async () => {
    await expect(myController(req, res, next))
      .rejects.toThrow(NotFoundError);
  });
});
```
