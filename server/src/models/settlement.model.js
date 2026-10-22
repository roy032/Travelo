import mongoose from "mongoose";

// A payment between two members that settles part of what one owes the other
const settlementSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Trip is required"],
      ref: "Trip",
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Payer is required"],
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Recipient is required"],
      ref: "User",
    },
    // In the trip's base currency
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, "Note must not exceed 200 characters"],
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

settlementSchema.index({ trip: 1, createdAt: -1 });

const Settlement = mongoose.model("Settlement", settlementSchema);

export default Settlement;
