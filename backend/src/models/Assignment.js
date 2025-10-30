const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    assignmentType: {
      type: String,
      enum: ["individual", "subscription"],
      default: "individual",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "completed"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    subscriptionDetails: {
      planType: {
        type: String,
        enum: ["weekly", "monthly"],
      },
      mealsPerWeek: {
        type: Number,
        min: 1,
        max: 21,
      },
      deliveryDays: [{
        type: String,
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      }],
      mealPreferences: {
        cuisines: [String],
        dietaryRestrictions: [String],
        allergies: [String],
      },
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      maxlength: 1000,
    },
    lastOrderDate: {
      type: Date,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ user: 1, chef: 1 }, { unique: true });
assignmentSchema.index({ chef: 1, status: 1 });
assignmentSchema.index({ user: 1, status: 1 });
assignmentSchema.index({ assignedBy: 1 });

assignmentSchema.pre("save", function (next) {
  if (this.assignmentType === "subscription" && !this.subscriptionDetails.planType) {
    return next(new Error("Subscription plan type is required for subscription assignments"));
  }
  next();
});

assignmentSchema.methods.isActive = function () {
  return this.status === "active" && (!this.endDate || this.endDate > new Date());
};

assignmentSchema.methods.canReceiveOrders = function () {
  return this.isActive() && this.chef.isAvailable;
};

assignmentSchema.methods.updateOrderStats = async function (orderAmount) {
  this.totalOrders += 1;
  this.totalAmount += orderAmount;
  this.lastOrderDate = new Date();
  await this.save();
};

module.exports = mongoose.model("Assignment", assignmentSchema);
