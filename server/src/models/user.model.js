import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    // Legacy verification fields (kept for backward compatibility)
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
    },
    verificationDocument: {
      key: String,
      url: String,
      filename: String,
      size: Number,
      path: String,
      uploadedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    // New trip-specific verification
    domesticVerification: {
      status: {
        type: String,
        enum: ["unverified", "pending", "verified"],
        default: "unverified",
      },
      document: {
        key: String, // UploadThing file key
        url: String, // UploadThing file URL
        filename: String,
        size: Number,
        uploadedAt: Date,
        reviewedAt: Date,
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    },
    internationalVerification: {
      status: {
        type: String,
        enum: ["unverified", "pending", "verified"],
        default: "unverified",
      },
      document: {
        key: String, // UploadThing file key
        url: String, // UploadThing file URL
        filename: String,
        size: Number,
        uploadedAt: Date,
        reviewedAt: Date,
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
userSchema.index({ verificationStatus: 1 });

// Pre-save hook for password hashing
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
