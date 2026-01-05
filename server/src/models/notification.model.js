import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "trip_invite",
        "trip_invite_sent",
        "trip_invite_accepted",
        "trip_invite_rejected",
        "join_request",
        "member_removed",
        "trip_removed",
        "trip_deleted",
        "expense_added",
        "message_sent",
        "activity_added",
        "verification_approved",
        "verification_rejected",
        "photo_uploaded",
        "document_uploaded",
        "note_shared",
        "checklist_updated",
        "checklist_reminder",
        "report_resolved",
        "report_reviewed",
        "report_dismissed",
        "trip_deleted_from_report",
      ],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [500, "Message must not exceed 500 characters"],
    },
    relatedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    relatedResource: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
