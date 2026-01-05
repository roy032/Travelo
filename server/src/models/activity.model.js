import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Trip is required"],
      ref: "Trip",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must not exceed 1000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
      validate: {
        validator: function (value) {
          // Validate HH:MM format
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        },
        message: "Time must be in HH:MM format",
      },
    },
    location: {
      name: {
        type: String,
        required: [true, "Location name is required"],
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      coordinates: {
        lat: {
          type: Number,
          min: -90,
          max: 90,
        },
        lng: {
          type: Number,
          min: -180,
          max: 180,
        },
      },
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Creator is required"],
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Custom validation to ensure activity date is within trip date range
activitySchema.pre("save", async function () {
  // Only validate if date is modified or document is new
  if (this.isModified("date") || this.isNew) {
    const Trip = mongoose.model("Trip");
    const trip = await Trip.findById(this.trip);

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Check if activity date is within trip date range
    const activityDate = new Date(this.date);
    const tripStartDate = new Date(trip.startDate);
    const tripEndDate = new Date(trip.endDate);

    // Set time to midnight for date comparison
    activityDate.setHours(0, 0, 0, 0);
    tripStartDate.setHours(0, 0, 0, 0);
    tripEndDate.setHours(0, 0, 0, 0);

    if (activityDate < tripStartDate || activityDate > tripEndDate) {
      throw new Error("Activity date must be within trip date range");
    }
  }
});

// Create indexes for efficient queries
activitySchema.index({ trip: 1 });
activitySchema.index({ date: 1 });
activitySchema.index({ trip: 1, date: 1 }); // Compound index for sorting activities by trip and date

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
