import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip reference is required"],
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous reports
      index: true,
    },
    category: {
      type: String,
      required: [true, "Report category is required"],
      enum: {
        values: [
          "spam",
          "inappropriate",
          "fake",
          "unsafe",
          "copyright",
          "other",
        ],
        message: "Invalid report category",
      },
      index: true,
    },
    description: {
      type: String,
      required: [true, "Report description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description must not exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [500, "Resolution notes must not exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reports from same user for same trip
// Only applies when reporter is not null (authenticated users)
reportSchema.index(
  { trip: 1, reporter: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { reporter: { $ne: null } },
  }
);

// Index for efficient admin queries
reportSchema.index({ status: 1, createdAt: -1 });

// Virtual to check if trip still exists
reportSchema.virtual("tripDetails", {
  ref: "Trip",
  localField: "trip",
  foreignField: "_id",
  justOne: true,
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
