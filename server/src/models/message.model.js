import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Trip is required'],
      ref: 'Trip',
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Sender is required'],
      ref: 'User',
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      minlength: [1, 'Message must not be empty'],
      maxlength: [2000, 'Message must not exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
messageSchema.index({ trip: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
