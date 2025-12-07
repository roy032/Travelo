import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Trip is required"],
      ref: "Trip",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "food",
        "transport",
        "accommodation",
        "activities",
        "shopping",
        "other",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description must not exceed 500 characters"],
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Payer is required"],
      ref: "User",
    },
    receipt: {
      filename: String,
      key: String, // UploadThing file key
      url: String, // UploadThing file URL
      path: String, // Legacy field for backward compatibility
      uploadedAt: Date,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Creator is required"],
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
expenseSchema.index({ trip: 1 });
expenseSchema.index({ payer: 1 });
expenseSchema.index({ trip: 1, createdAt: -1 }); // Compound index for sorting expenses by trip and date

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
