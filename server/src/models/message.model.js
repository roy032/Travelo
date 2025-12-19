import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip reference is required"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender reference is required"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: [2000, "Message must not exceed 2000 characters"],
    },
    // Future features
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient pagination queries
// Sort by trip + createdAt DESC for cursor-based pagination
messageSchema.index({ trip: 1, createdAt: -1 });

// Index for efficient sender queries
messageSchema.index({ sender: 1, createdAt: -1 });

// Virtual for checking if message is read by a specific user
messageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some((read) => read.user.toString() === userId.toString());
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
