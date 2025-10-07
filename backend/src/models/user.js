import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    //Basic Info
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
    },

    //Contact & Auth
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },

    //Role Management
    role: {
      type: String,
      enum: ["user", "chef", "admin"],
      default: "user",
    },

    //Profile Details
    profileImage: {
      type: String, // URL of profile pic
      default: "",
    },
    about: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    //Address & Location
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    currentLocation: {
      type: String,
      default: "",
    },

    //Preferences & Settings
    preferences: {
      cuisines: [String], // ["Indian", "Korean", "Healthy", etc.]
      dietaryType: {
        type: String,
        enum: ["Veg", "Non-Veg", "Vegan", "Other"],
        default: "Veg",
      },
      occasion: String,
      notificationsEnabled: { type: Boolean, default: true },
      language: { type: String, default: "English" },
      accessibility: { type: Boolean, default: false },
      privacyAccepted: { type: Boolean, default: false },
    },

    //Subscription / Payment
    subscription: {
      plan: {
        type: String,
        enum: ["Weekly", "Monthly", "None"],
        default: "None",
      },
      startDate: Date,
      expiryDate: Date,
      paymentMethod: String, // "UPI", "Credit Card", etc.
      isActive: { type: Boolean, default: false },
    },

    //Reservation / Order Reference
    reservations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reservation",
      },
    ],

    //Notifications
    notifications: [
      {
        message: String,
        type: { type: String }, // "chef-assigned", "order-updated", etc.
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
