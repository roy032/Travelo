import cron from "node-cron";
import Trip from "#models/trip.model.js";
import ChecklistItem from "#models/checklist.model.js";
import Notification from "#models/notification.model.js";

/**
 * Check for trips ending in 2 days and send notifications
 * about incomplete checklist items to all trip members
 */
async function checkIncompleteChecklists() {
  try {
    console.log("Running checklist notification job...");

    // Calculate the date range for trips ending in 2 days
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find trips that end in approximately 2 days (between 2 and 3 days from now)
    const endingTrips = await Trip.find({
      endDate: {
        $gte: twoDaysFromNow,
        $lt: threeDaysFromNow,
      },
      isDeleted: false,
    }).populate("members owner", "username email");

    console.log(`Found ${endingTrips.length} trips ending in 2 days`);

    for (const trip of endingTrips) {
      // Find unchecked checklist items for this trip
      const incompleteItems = await ChecklistItem.find({
        trip: trip._id,
        isChecked: false,
      }).populate("creator", "username");

      if (incompleteItems.length === 0) {
        console.log(`Trip "${trip.title}" has no incomplete checklist items`);
        continue;
      }

      console.log(
        `Trip "${trip.title}" has ${incompleteItems.length} incomplete items`
      );

      // Create a message listing all incomplete items
      const itemsList = incompleteItems
        .map((item, index) => `${index + 1}. ${item.text}`)
        .join(", ");

      const message = `Your trip "${trip.title}" ends in 2 days. Incomplete checklist items: ${itemsList}`;
      const title = `Checklist Reminder: ${trip.title}`;

      // Get all trip members (including owner)
      const allMembers = [
        ...new Set([
          trip.owner._id.toString(),
          ...trip.members.map((m) => m._id.toString()),
        ]),
      ];

      // Check if notifications were already sent today for this trip
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingNotification = await Notification.findOne({
        relatedTrip: trip._id,
        type: "checklist_reminder",
        createdAt: { $gte: today },
      });

      if (existingNotification) {
        console.log(`Notification already sent today for trip "${trip.title}"`);
        continue;
      }

      // Create notifications for all trip members
      const notifications = allMembers.map((memberId) => ({
        user: memberId,
        type: "checklist_reminder",
        title,
        message,
        relatedTrip: trip._id,
        isRead: false,
      }));

      await Notification.insertMany(notifications);
      console.log(
        `Sent ${notifications.length} notifications for trip "${trip.title}"`
      );
    }

    console.log("Checklist notification job completed");
  } catch (error) {
    console.error("Error in checklist notification job:", error);
  }
}

/**
 * Initialize the scheduled job
 * Runs every day at 9:00 AM
 */
export function startChecklistNotificationJob() {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log(
      "Starting scheduled checklist notification job at",
      new Date().toISOString()
    );
    await checkIncompleteChecklists();
  });

  console.log("Checklist notification job scheduled to run daily at 9:00 AM");
}

// Export the function for manual testing
export { checkIncompleteChecklists };
