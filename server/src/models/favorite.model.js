import mongoose from 'mongoose';

export const FAVORITE_TYPES = ['destination', 'trip'];

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    itemType: {
      type: String,
      enum: FAVORITE_TYPES,
      required: [true, 'Item type is required'],
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Item is required'],
    },
  },
  {
    timestamps: true,
  }
);

// A user can save each item once
favoriteSchema.index({ user: 1, itemType: 1, item: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
