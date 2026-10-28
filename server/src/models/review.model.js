import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: [true, 'Destination is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review must not exceed 2000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per destination
reviewSchema.index({ destination: 1, user: 1 }, { unique: true });
reviewSchema.index({ destination: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
