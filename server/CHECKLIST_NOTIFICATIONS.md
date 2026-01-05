# Checklist Notification System

## Overview

The checklist notification system automatically reminds trip members about incomplete checklist items when their trip is about to end in 2 days.

## Features

### Automatic Notifications

- **Scheduled Job**: Runs daily at 9:00 AM
- **Trigger Condition**: Trips ending in 2 days (between 48-72 hours from now)
- **Notification Criteria**: Only sends if there are unchecked checklist items
- **Recipients**: All trip members (including owner)
- **Notification Type**: `checklist_reminder`

### Notification Content

The notification includes:

- **Title**: "Checklist Reminder: [Trip Title]"
- **Message**: Lists all incomplete checklist items with their text
- **Format**: "Your trip '[Trip Title]' ends in 2 days. Incomplete checklist items: 1. [Item 1], 2. [Item 2], ..."

### Deduplication

- Only one notification per trip per day
- Prevents spam if the job runs multiple times

## Implementation Details

### Files Created/Modified

1. **New Files**:
   - [`server/src/jobs/checklistNotifications.js`](../server/src/jobs/checklistNotifications.js) - Core notification job logic

2. **Modified Files**:
   - [`server/src/models/notification.model.js`](../server/src/models/notification.model.js) - Added `checklist_reminder` type
   - [`server/src/server.js`](../server/src/server.js) - Initialize cron job on startup
   - [`server/src/controllers/checklist.controller.js`](../server/src/controllers/checklist.controller.js) - Added manual trigger endpoint
   - [`server/src/routes/checklist.route.js`](../server/src/routes/checklist.route.js) - Added manual trigger route

### Dependencies

- `node-cron`: For scheduling recurring tasks

## Usage

### Automatic Execution

The job runs automatically every day at 9:00 AM. No manual intervention required.

### Manual Testing

For testing or debugging purposes, you can manually trigger the notification check:

**Endpoint**: `POST /api/checklist/trigger-reminders`

**Authentication**: Required (any authenticated user)

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/checklist/trigger-reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response**:

```json
{
  "message": "Checklist reminder notifications triggered successfully"
}
```

## Configuration

### Schedule Customization

To change the schedule, edit the cron expression in [`checklistNotifications.js`](../server/src/jobs/checklistNotifications.js):

```javascript
// Current: Every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  // ...
});

// Examples:
// Every hour: '0 * * * *'
// Twice a day (9 AM and 6 PM): '0 9,18 * * *'
// Every Monday at 8 AM: '0 8 * * 1'
```

### Time Window Customization

To change when notifications are sent (default: 2 days before trip ends):

Edit the date calculations in `checkIncompleteChecklists()`:

```javascript
// Current: 2 days before
const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

// Example: 1 day before
const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
```

## Monitoring

The job logs its activity to the console:

- Job start/completion
- Number of trips found
- Number of incomplete items per trip
- Notifications sent
- Errors encountered

**Example Log Output**:

```
Starting scheduled checklist notification job at 2025-12-24T09:00:00.000Z
Running checklist notification job...
Found 3 trips ending in 2 days
Trip "Beach Vacation" has 5 incomplete items
Sent 4 notifications for trip "Beach Vacation"
Trip "Mountain Hiking" has no incomplete checklist items
Checklist notification job completed
```

## Workflow

```
1. Cron job triggers at 9:00 AM daily
2. Find trips ending between 2-3 days from now
3. For each trip:
   a. Check for unchecked checklist items
   b. If none found, skip to next trip
   c. If found:
      - Check if notification already sent today
      - Create notification message with item list
      - Send to all trip members
      - Log results
4. Complete and wait for next scheduled run
```

## Future Enhancements

Potential improvements:

- Configurable notification timing per trip
- Multiple reminder intervals (e.g., 7 days, 3 days, 1 day)
- Email notifications in addition to in-app
- User preferences for notification frequency
- Summary notifications for multiple trips
- Push notifications for mobile apps
