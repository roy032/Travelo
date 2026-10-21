import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name must not exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['beach', 'mountain', 'city', 'countryside', 'historical', 'adventure'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    images: [
      {
        filename: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        isFeatured: {
          type: Boolean,
          default: false,
        },
      },
    ],
    highlights: [
      {
        type: String,
        trim: true,
      },
    ],
    bestTimeToVisit: {
      type: String,
      trim: true,
    },
    // Kept in sync with the Review collection by review.service.js
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
destinationSchema.index({ category: 1 });
destinationSchema.index({ country: 1 });
destinationSchema.index({ ratingAverage: -1 });

const Destination = mongoose.model('Destination', destinationSchema);

export default Destination;
