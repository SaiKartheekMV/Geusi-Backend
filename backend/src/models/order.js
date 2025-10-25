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
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
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
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
      enum: ["new", "confirmed", "preparing", "onTheWay", "delivered", "cancelled", "rejected"],
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
    orderType: {
      type: String,
      enum: ["individual", "subscription"],
      default: "individual",
    },
    subscriptionOrder: {
      isSubscriptionOrder: {
        type: Boolean,
        default: false,
      },
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
      deliveryDay: {
        type: String,
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      },
      weekNumber: {
        type: Number,
        min: 1,
        max: 52,
      },
    },
    preparationTime: {
      estimatedMinutes: {
        type: Number,
        min: 15,
        max: 480,
      },
      actualMinutes: {
        type: Number,
        min: 0,
      },
    },
    deliveryTime: {
      estimatedMinutes: {
        type: Number,
        min: 5,
        max: 120,
      },
      actualMinutes: {
        type: Number,
        min: 0,
      },
    },
    chefNotes: {
      type: String,
      maxlength: 500,
    },
    userRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: {
        type: String,
        maxlength: 1000,
      },
      ratedAt: {
        type: Date,
      },
    },
    orderTimeline: [
      {
        status: {
          type: String,
          enum: ["new", "confirmed", "preparing", "onTheWay", "delivered", "cancelled", "rejected"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: String,
          enum: ["user", "chef", "admin", "system"],
        },
        notes: {
          type: String,
          maxlength: 200,
        },
        location: {
          latitude: Number,
          longitude: Number,
          address: String
        },
        estimatedArrival: Date
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ chef: 1, status: 1 });
orderSchema.index({ assignment: 1, status: 1 });
orderSchema.index({ "subscriptionOrder.subscriptionId": 1 });
orderSchema.index({ scheduledDate: 1 });

orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.orderTimeline.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: "system",
    });
  }
  next();
});

orderSchema.methods.updateStatus = async function (newStatus, updatedBy = "system", notes = "", location = null, estimatedArrival = null) {
  this.status = newStatus;
  
  const timelineEntry = {
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    notes
  };
  
  if (location) {
    timelineEntry.location = location;
  }
  
  if (estimatedArrival) {
    timelineEntry.estimatedArrival = estimatedArrival;
  }
  
  this.orderTimeline.push(timelineEntry);
  await this.save();
};

orderSchema.methods.canBeCancelled = function () {
  return ["new", "confirmed"].includes(this.status);
};

orderSchema.methods.canBeUpdatedByChef = function () {
  return ["confirmed", "preparing", "onTheWay"].includes(this.status);
};

orderSchema.methods.isAssigned = function () {
  return !!(this.assignment && this.chef);
};

orderSchema.methods.getEstimatedDeliveryTime = function () {
  if (!this.scheduledDate) return null;
  
  const scheduledTime = new Date(this.scheduledDate);
  const prepTime = this.preparationTime?.estimatedMinutes || 30;
  const deliveryTime = this.deliveryTime?.estimatedMinutes || 15;
  
  scheduledTime.setMinutes(scheduledTime.getMinutes() + prepTime + deliveryTime);
  return scheduledTime;
};

module.exports = mongoose.model("Order", orderSchema);
