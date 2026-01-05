# Trip List Filtering and Search API

## Overview
The trip list endpoint now supports filtering, searching, and sorting capabilities to help users find and organize their trips.

## Endpoint
```
GET /api/trips
```

## Query Parameters

### filter
Filter trips by their date status:
- `all` (default) - Returns all trips
- `upcoming` - Returns trips that haven't started yet (startDate >= current date)
- `past` - Returns trips that have ended (endDate < current date)

**Example:**
```
GET /api/trips?filter=upcoming
GET /api/trips?filter=past
```

### search
Search trips by title (case-insensitive, partial match):
- Accepts any string value
- Searches within trip titles using case-insensitive regex matching

**Example:**
```
GET /api/trips?search=beach
GET /api/trips?search=mountain
```

### sortBy
Choose which date field to sort by:
- `startDate` (default) - Sort by trip start date
- `endDate` - Sort by trip end date

**Example:**
```
GET /api/trips?sortBy=endDate
```

### sortOrder
Choose the sort direction:
- `desc` (default) - Descending order (newest first)
- `asc` - Ascending order (oldest first)

**Example:**
```
GET /api/trips?sortOrder=asc
```

## Combined Examples

### Get upcoming trips sorted by start date (ascending)
```
GET /api/trips?filter=upcoming&sortOrder=asc
```

### Search for "beach" trips in the past
```
GET /api/trips?filter=past&search=beach
```

### Search for "mountain" trips sorted by end date
```
GET /api/trips?search=mountain&sortBy=endDate&sortOrder=desc
```

## Response Format
```json
{
  "trips": [
    {
      "id": "trip_id",
      "title": "Trip Title",
      "description": "Trip description",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-07T00:00:00.000Z",
      "destinationType": "beach",
      "owner": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
      },
      "memberCount": 3,
      "members": [...],
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

## Implementation Details

### Service Layer (trip.service.js)
The `getUserTrips` function now accepts an optional `options` parameter:
```javascript
export const getUserTrips = async (userId, options = {})
```

### Controller Layer (trip.controller.js)
The `getUserTripsController` extracts query parameters and passes them to the service:
```javascript
const { filter, search, sortBy, sortOrder } = req.query;
```

### Requirements Validated
- **29.1**: Get all trips where user is owner or member
- **29.3**: Filter by upcoming/past trips
- **29.4**: Search by trip title
- **29.5**: Sort by date
