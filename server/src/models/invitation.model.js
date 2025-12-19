import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip is required"],
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Inviter is required"],
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invited user is required"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
invitationSchema.index({ trip: 1, invitedUser: 1 });
invitationSchema.index({ invitedUser: 1, status: 1 });
invitationSchema.index({ invitedBy: 1 });

// Compound index to prevent duplicate pending invitations
invitationSchema.index(
  { trip: 1, invitedUser: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
