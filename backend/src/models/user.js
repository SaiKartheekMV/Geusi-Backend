import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },

    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    profileImage: {
      type: String,
      default: "",
    },

    householdSize: {
      type: Number,
      min: 1,
      default: 1,
    },

    address: {
      street: {
        type: String,
        required: function() {
          return this.address && (this.address.city || this.address.state || this.address.pincode);
        },
      },
      city: {
        type: String,
        required: function() {
          return this.address && (this.address.street || this.address.state || this.address.pincode);
        },
      },
      state: {
        type: String,
        required: function() {
          return this.address && (this.address.street || this.address.city || this.address.pincode);
        },
      },
      pincode: {
        type: String,
        required: function() {
          return this.address && (this.address.street || this.address.city || this.address.state);
        },
      },
    },
    currentLocation: {
      type: String,
      default: "",
    },

    preferences: {
      cuisines: [String],
      dietaryType: {
        type: String,
        enum: ["Veg", "Non-Veg", "Vegan", "Other"],
        default: "Veg",
      },
      allergies: [String],
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      language: {
        type: String,
        default: "English",
      },
      accessibility: {
        type: Boolean,
        default: false,
      },
      privacyAccepted: {
        type: Boolean,
        default: false,
      },
    },

    subscription: {
      plan: {
        type: String,
        enum: ["Weekly", "Monthly", "None"],
        default: "None",
      },
      startDate: Date,
      expiryDate: Date,
      paymentMethod: String,
      isActive: {
        type: Boolean,
        default: false,
      },
    },

    reservations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reservation",
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

    refreshToken: {
      type: String,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const bcrypt = require("bcryptjs");
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);