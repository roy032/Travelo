import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Trip is required'],
      ref: 'Trip',
    },
    text: {
      type: String,
      required: [true, 'Text is required'],
      trim: true,
      minlength: [1, 'Text must be at least 1 character'],
      maxlength: [200, 'Text must not exceed 200 characters'],
    },
    isChecked: {
      type: Boolean,
      default: false,
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checkedAt: {
      type: Date,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Creator is required'],
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
checklistItemSchema.index({ trip: 1 });

const ChecklistItem = mongoose.model('ChecklistItem', checklistItemSchema);

export default ChecklistItem;
