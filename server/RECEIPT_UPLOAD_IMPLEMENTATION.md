# Receipt Upload Implementation

## Overview
This document describes the implementation of receipt upload functionality for expenses in the travel planner application.

## Requirements Implemented

### Requirement 20.1: File Format and Size Validation
✅ **Implemented**: Receipt upload accepts JPEG and PNG formats up to 5MB
- Location: `server/src/middlewares/upload.middleware.js`
- Implementation: `receiptFileFilter` validates MIME types (image/jpeg, image/png)
- File size limit: 5MB configured in multer options

### Requirement 20.2: Receipt Association with Expense
✅ **Implemented**: Receipts are associated with expense entries
- Location: `server/src/controllers/expense.controller.js`
- Implementation: 
  - `createExpenseController`: Adds receipt data to expense on creation
  - `updateExpenseController`: Adds receipt data to expense on update
- Receipt data includes: filename, path, uploadedAt timestamp

### Requirement 20.4: Upload Error Handling
✅ **Implemented**: Descriptive error messages for upload failures
- Location: `server/src/middlewares/upload.middleware.js`
- Implementation: `handleUploadError` middleware
- Error responses:
  - 413 Payload Too Large: File exceeds 5MB limit
  - 415 Unsupported Media Type: Invalid file format
  - 400 Bad Request: Other multer errors

### Requirement 20.5: Receipt Deletion on Expense Deletion
✅ **Implemented**: Receipt files are deleted when expense is deleted
- Location: `server/src/service/expense.service.js`
- Implementation: 
  - `deleteExpense`: Deletes receipt file from filesystem using fs.unlink()
  - `updateExpense`: Deletes old receipt when new one is uploaded
- Error handling: Gracefully handles file system errors without failing the operation

## Files Modified

### 1. server/src/middlewares/upload.middleware.js
- Added `receiptStorage` configuration for multer
- Added `receiptFileFilter` to validate JPEG and PNG formats
- Added `uploadReceipt` middleware export
- Existing `handleUploadError` middleware handles receipt upload errors

### 2. server/src/controllers/expense.controller.js
- Modified `createExpenseController` to handle receipt upload from req.file
- Modified `updateExpenseController` to handle receipt upload from req.file
- Receipt data structure: { filename, path, uploadedAt }

### 3. server/src/service/expense.service.js
- Added imports: `fs from 'fs/promises'` and `path`
- Modified `deleteExpense` to delete receipt file before deleting expense
- Modified `updateExpense` to delete old receipt when uploading new one
- Graceful error handling: Logs file deletion errors but continues operation

### 4. server/src/routes/expense.route.js
- Added import: `uploadReceipt` and `handleUploadError` from upload middleware
- Modified POST `/trips/:tripId/expenses` route to include upload middleware
- Modified PUT `/trips/:tripId/expenses/:expenseId` route to include upload middleware
- Middleware order: isTripMember → uploadReceipt → handleUploadError → controller

## API Usage

### Creating Expense with Receipt
```http
POST /trips/:tripId/expenses
Content-Type: multipart/form-data

Fields:
- amount: number (required)
- currency: string (optional, default: USD)
- category: string (required)
- description: string (required)
- payer: string (required, user ID)
- receipt: file (optional, JPEG or PNG, max 5MB)
```

### Updating Expense with Receipt
```http
PUT /trips/:tripId/expenses/:expenseId
Content-Type: multipart/form-data

Fields:
- amount: number (optional)
- currency: string (optional)
- category: string (optional)
- description: string (optional)
- payer: string (optional)
- receipt: file (optional, JPEG or PNG, max 5MB)
```

## Storage Structure
Receipts are stored in: `server/src/uploads/receipts/`
Filename format: `{userId}-{timestamp}-{sanitizedOriginalName}.{ext}`

## Error Responses

### File Too Large (413)
```json
{
  "error": "Upload failed",
  "message": "File size exceeds the 5MB limit"
}
```

### Invalid Format (415)
```json
{
  "error": "Upload failed",
  "message": "Invalid file format. Only JPEG and PNG files are allowed."
}
```

### Other Upload Errors (400)
```json
{
  "error": "Upload failed",
  "message": "{specific error message}"
}
```

## Testing Recommendations

### Manual Testing
1. Create expense with valid JPEG receipt (< 5MB) - should succeed
2. Create expense with valid PNG receipt (< 5MB) - should succeed
3. Create expense with PDF receipt - should fail with 415 error
4. Create expense with receipt > 5MB - should fail with 413 error
5. Update expense with new receipt - should succeed and delete old receipt
6. Delete expense with receipt - should succeed and delete receipt file
7. Create expense without receipt - should succeed

### Property-Based Testing
Consider testing:
- Property 75: Receipt upload validation (formats and sizes)
- Property 76: Receipt association with expense
- Property 78: Receipt cascade deletion

## Notes
- Receipt upload is optional for both create and update operations
- Old receipts are automatically deleted when:
  - A new receipt is uploaded during update
  - The expense is deleted
- File deletion errors are logged but don't fail the operation
- This ensures data consistency even if file system operations fail
