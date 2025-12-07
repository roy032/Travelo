import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must not exceed 2000 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          // Ensure endDate is greater than or equal to startDate
          return value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
    },
    destinationType: {
      type: String,
      enum: ["beach", "mountain", "city", "countryside", "other"],
    },
    tripCategory: {
      type: String,
      enum: ["domestic", "international"],
      required: [true, "Trip category is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Owner is required"],
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
tripSchema.index({ owner: 1 });
tripSchema.index({ members: 1 });

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
