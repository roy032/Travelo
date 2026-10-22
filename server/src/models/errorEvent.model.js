import mongoose from "mongoose";

/**
 * Unexpected (5xx) server errors, kept for the admin analytics charts.
 * Entries expire after 90 days.
 */
const errorEventSchema = new mongoose.Schema(
  {
    status: { type: Number, required: true },
    method: { type: String },
    path: { type: String, maxlength: 300 },
    message: { type: String, maxlength: 500 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

errorEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ErrorEvent = mongoose.model("ErrorEvent", errorEventSchema);

export default ErrorEvent;
