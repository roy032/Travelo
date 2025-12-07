import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Trip is required'],
      ref: 'Trip',
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [10000, 'Content must not exceed 10000 characters'],
    },
    visibility: {
      type: String,
      required: [true, 'Visibility is required'],
      enum: {
        values: ['private', 'shared'],
        message: 'Visibility must be either private or shared',
      },
      default: 'shared',
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
noteSchema.index({ trip: 1 });
noteSchema.index({ creator: 1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
