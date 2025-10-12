const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      default: null,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    numberOfPersons: {
      type: Number,
      default: 1,
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      type: String,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },
    estimatedPrice: {
      type: Number,
      default: 0,
    },
    actualPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["new", "confirmed", "preparing", "on_the_way", "delivered", "cancelled"],
      default: "new",
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ["user", "chef", "admin"],
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for faster searching
orderSchema.index({ user: 1, status: 1, createdAt: -1 });
orderSchema.index({ chef: 1, status: 1 });
orderSchema.index({ foodName: "text", description: "text" });

module.exports = mongoose.model("Order", orderSchema);