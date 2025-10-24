const mongoose = require("mongoose");

const chefSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    cuisineSpecialty: [String],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: true
      },
      slots: [{
        startTime: {
          type: String,
          required: true
        },
        endTime: {
          type: String,
          required: true
        },
        isBooked: {
          type: Boolean,
          default: false
        }
      }]
    }],
    unavailableDates: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }]
  },
  serviceAreas: [{
    city: String,
    state: String,
    pincode: String,
    radius: Number
  }],
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    assignments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
    notifications: [
      {
        message: String,
        type: {
          type: String,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

chefSchema.add({
  refreshToken: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
});

chefSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const bcrypt = require("bcryptjs");
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

chefSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Chef", chefSchema);