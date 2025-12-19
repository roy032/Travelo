import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Trip is required"],
      ref: "Trip",
    },
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
    },
    fileKey: {
      type: String,
      required: [true, "File key is required"],
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [500, "Caption must not exceed 500 characters"],
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Uploader is required"],
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
photoSchema.index({ trip: 1 });
photoSchema.index({ uploader: 1 });
photoSchema.index({ trip: 1, uploadedAt: -1 }); // Compound index for sorting photos by trip and upload date

const Photo = mongoose.model("Photo", photoSchema);

export default Photo;
