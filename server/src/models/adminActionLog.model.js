import mongoose from "mongoose";

/**
 * Admin Action Log Schema
 * Logs all administrative actions for audit purposes
 */
const adminActionLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin user is required"],
      index: true,
    },
    actionType: {
      type: String,
      required: [true, "Action type is required"],
      enum: [
        "report_resolved",
        "report_reviewed",
        "report_dismissed",
        "trip_deleted_from_report",
        "user_banned",
        "user_unbanned",
        "content_removed",
      ],
      index: true,
    },
    targetType: {
      type: String,
      required: [true, "Target type is required"],
      enum: ["report", "trip", "user", "content"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Action message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [1000, "Message must not exceed 1000 characters"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
adminActionLogSchema.index({ admin: 1, createdAt: -1 });
adminActionLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const AdminActionLog = mongoose.model("AdminActionLog", adminActionLogSchema);

export default AdminActionLog;
