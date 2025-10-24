const Assignment = require("../models/Assignment");
const Order = require("../models/Order");
const User = require("../models/User");
const Chef = require("../models/Chef");

const generateSubscriptionOrders = async (assignmentId, startDate, endDate) => {
  try {
    const assignment = await Assignment.findById(assignmentId)
      .populate("user", "firstName lastName email phone")
      .populate("chef", "firstName lastName email phone");

    if (!assignment || assignment.assignmentType !== "subscription") {
      throw new Error("Invalid subscription assignment");
    }

    const { subscriptionDetails } = assignment;
    const { planType, mealsPerWeek, deliveryDays } = subscriptionDetails;

    const orders = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    let weekNumber = 1;
    const deliveryDaysArray = deliveryDays || ["monday", "tuesday", "wednesday", "thursday", "friday"];

  // Ensure we have a safe deliveryAddress object to avoid cast errors
  const deliveryAddressSafe = (assignment.user && assignment.user.address) ? assignment.user.address : { street: "", city: "", state: "", pincode: "" };

  while (currentDate <= end) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      for (let i = 0; i < mealsPerWeek && i < deliveryDaysArray.length; i++) {
        const deliveryDay = deliveryDaysArray[i];
        const deliveryDate = getNextDeliveryDate(weekStart, deliveryDay);

          if (deliveryDate <= end) {
          const orderData = {
            user: assignment.user._id,
            chef: assignment.chef._id,
            assignment: assignment._id,
            foodName: `Subscription Meal - Week ${weekNumber}`,
            description: `Weekly subscription meal for ${assignment.user.firstName}`,
            quantity: 1,
            numberOfPersons: assignment.user.householdSize || 1,
            scheduledDate: deliveryDate,
            scheduledTime: "12:00",
            specialInstructions: "Subscription meal - please follow dietary preferences",
            deliveryAddress: deliveryAddressSafe,
            estimatedPrice: 0,
            orderType: "subscription",
            status: "confirmed",
            subscriptionOrder: {
              isSubscriptionOrder: true,
              subscriptionId: assignment._id,
              deliveryDay: deliveryDay,
              weekNumber: weekNumber,
            },
          };

          orders.push(orderData);
        }
      }

      weekNumber++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

  // Create orders one-by-one to surface validation errors per-order
    const createdOrders = [];
    const errors = [];

  console.log("Subscription generation: deliveryAddressSafe=", JSON.stringify(deliveryAddressSafe));

    for (const od of orders) {
      console.log('Creating order with deliveryAddress:', JSON.stringify(od.deliveryAddress));
      try {
        const o = new Order(od);
        const saved = await o.save();
        createdOrders.push(saved);
      } catch (err) {
        errors.push({ order: od, error: err.message });
        console.error("Failed to create subscription order:", err.message);
      }
    }

    if (createdOrders.length === 0) {
      return {
        success: false,
        error: errors[0]?.error || "No orders created",
        errors,
      };
    }

    await assignment.updateOrderStats(createdOrders.length * 50);

    return {
      success: true,
      ordersCreated: createdOrders.length,
      orders: createdOrders,
      errors,
    };
  } catch (error) {
    console.error("Generate subscription orders error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const getNextDeliveryDate = (startDate, deliveryDay) => {
  const dayMap = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  const targetDay = dayMap[deliveryDay.toLowerCase()];
  const currentDay = startDate.getDay();
  
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const deliveryDate = new Date(startDate);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  
  return deliveryDate;
};

const pauseSubscription = async (assignmentId, pauseReason) => {
  try {
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.assignmentType !== "subscription") {
      throw new Error("Invalid subscription assignment");
    }

    assignment.status = "suspended";
    assignment.notes = assignment.notes ? 
      `${assignment.notes}\nPaused: ${pauseReason}` : 
      `Paused: ${pauseReason}`;

    await assignment.save();

    await Order.updateMany(
      {
        assignment: assignmentId,
        status: { $in: ["new", "confirmed"] },
      },
      {
        status: "cancelled",
        cancelReason: `Subscription paused: ${pauseReason}`,
        cancelledBy: "admin",
      }
    );

    return {
      success: true,
      message: "Subscription paused successfully",
    };
  } catch (error) {
    console.error("Pause subscription error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const resumeSubscription = async (assignmentId) => {
  try {
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.assignmentType !== "subscription") {
      throw new Error("Invalid subscription assignment");
    }

    if (assignment.status !== "suspended") {
      throw new Error("Assignment is not paused");
    }

    assignment.status = "active";
    await assignment.save();

    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const result = await generateSubscriptionOrders(
      assignmentId,
      today,
      nextMonth
    );

    return {
      success: true,
      message: "Subscription resumed successfully",
      ordersGenerated: result.ordersCreated,
    };
  } catch (error) {
    console.error("Resume subscription error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const getSubscriptionStatus = async (assignmentId) => {
  try {
    const assignment = await Assignment.findById(assignmentId)
      .populate("user", "firstName lastName email")
      .populate("chef", "firstName lastName email");

    if (!assignment || assignment.assignmentType !== "subscription") {
      throw new Error("Invalid subscription assignment");
    }

    const orders = await Order.find({
      assignment: assignmentId,
    }).sort({ createdAt: -1 });

    const stats = await Order.aggregate([
      { $match: { assignment: assignmentId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const upcomingOrders = await Order.find({
      assignment: assignmentId,
      status: { $in: ["new", "confirmed"] },
      scheduledDate: { $gte: new Date() },
    }).sort({ scheduledDate: 1 });

    return {
      success: true,
      assignment: {
        _id: assignment._id,
        user: assignment.user,
        chef: assignment.chef,
        status: assignment.status,
        subscriptionDetails: assignment.subscriptionDetails,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        totalOrders: assignment.totalOrders,
        totalAmount: assignment.totalAmount,
      },
      orderStats: stats,
      upcomingOrders: upcomingOrders.slice(0, 5),
      totalOrders: orders.length,
    };
  } catch (error) {
    console.error("Get subscription status error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const updateSubscriptionPreferences = async (assignmentId, preferences) => {
  try {
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.assignmentType !== "subscription") {
      throw new Error("Invalid subscription assignment");
    }

    if (assignment.status !== "active") {
      throw new Error("Cannot update preferences for inactive subscription");
    }

    const { cuisines, dietaryRestrictions, allergies } = preferences;

    assignment.subscriptionDetails.mealPreferences = {
      cuisines: cuisines || assignment.subscriptionDetails.mealPreferences?.cuisines || [],
      dietaryRestrictions: dietaryRestrictions || assignment.subscriptionDetails.mealPreferences?.dietaryRestrictions || [],
      allergies: allergies || assignment.subscriptionDetails.mealPreferences?.allergies || [],
    };

    await assignment.save();

    return {
      success: true,
      message: "Subscription preferences updated successfully",
      preferences: assignment.subscriptionDetails.mealPreferences,
    };
  } catch (error) {
    console.error("Update subscription preferences error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  generateSubscriptionOrders,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionStatus,
  updateSubscriptionPreferences,
};
