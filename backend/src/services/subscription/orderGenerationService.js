const Assignment = require("../../models/Assignment");
const Order = require("../../models/order");
const { logger } = require("../loggerService");

const createServiceResponse = (success, data = null, message = "", error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (success && data !== null) {
    response.data = data;
  }

  if (!success && error) {
    response.error = error.message || error;
    if (process.env.NODE_ENV === "development" && error.stack) {
      response.stack = error.stack;
    }
  }

  return response;
};

const getNextDeliveryDate = (startDate, deliveryDay) => {
  try {
    if (!startDate || !deliveryDay) {
      throw new Error("Start date and delivery day are required");
    }

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
    if (targetDay === undefined) {
      throw new Error(`Invalid delivery day: ${deliveryDay}`);
    }

    const currentDay = startDate.getDay();
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const deliveryDate = new Date(startDate);
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    
    return deliveryDate;
  } catch (error) {
    logger.error("Error calculating next delivery date:", error);
    throw error;
  }
};

const generateSubscriptionOrders = async (assignmentId, startDate, endDate) => {
  try {
    if (!assignmentId || !startDate || !endDate) {
      return createServiceResponse(false, null, "Assignment ID, start date, and end date are required", new Error("Invalid parameters"));
    }

    const assignment = await Assignment.findById(assignmentId)
      .populate("user", "firstName lastName email phone address householdSize")
      .populate("chef", "firstName lastName email phone");

    if (!assignment) {
      return createServiceResponse(false, null, "Assignment not found", new Error("Assignment not found"));
    }

    if (assignment.assignmentType !== "subscription") {
      return createServiceResponse(false, null, "Invalid assignment type for subscription orders", new Error("Invalid assignment type"));
    }

    const { subscriptionDetails } = assignment;
    if (!subscriptionDetails) {
      return createServiceResponse(false, null, "Subscription details not found", new Error("Subscription details missing"));
    }

    const { planType, mealsPerWeek, deliveryDays } = subscriptionDetails;

    if (!planType || !mealsPerWeek || !deliveryDays) {
      return createServiceResponse(false, null, "Incomplete subscription details", new Error("Missing required subscription fields"));
    }

    const orders = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    let weekNumber = 1;
    const deliveryDaysArray = Array.isArray(deliveryDays) ? deliveryDays : ["monday", "tuesday", "wednesday", "thursday", "friday"];

    const deliveryAddressSafe = (assignment.user && assignment.user.address) ? assignment.user.address : { 
      street: "", 
      city: "", 
      state: "", 
      pincode: "" 
    };

    while (currentDate <= end) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      for (let i = 0; i < mealsPerWeek && i < deliveryDaysArray.length; i++) {
        const deliveryDay = deliveryDaysArray[i];
        
        try {
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
        } catch (error) {
          logger.error(`Error processing delivery day ${deliveryDay} for week ${weekNumber}:`, error);
          continue;
        }
      }

      weekNumber++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    if (orders.length === 0) {
      return createServiceResponse(false, null, "No orders could be generated for the given date range", new Error("No orders generated"));
    }

    const createdOrders = [];
    const errors = [];

    for (const orderData of orders) {
      try {
        const order = new Order(orderData);
        const savedOrder = await order.save();
        createdOrders.push(savedOrder);
      } catch (error) {
        logger.error("Error creating order:", error);
        errors.push({ order: orderData, error: error.message });
      }
    }

    if (createdOrders.length === 0) {
      return createServiceResponse(false, null, "Failed to create any orders", new Error("Order creation failed"), { errors });
    }

    try {
      await assignment.updateOrderStats(createdOrders.length * 50);
    } catch (error) {
      logger.error("Error updating assignment stats:", error);
    }

    return createServiceResponse(true, {
      ordersCreated: createdOrders.length,
      orders: createdOrders,
      errors: errors.length > 0 ? errors : undefined,
    }, "Subscription orders generated successfully");

  } catch (error) {
    logger.error("Generate subscription orders error:", error);
    return createServiceResponse(false, null, "Failed to generate subscription orders", error);
  }
};

module.exports = {
  generateSubscriptionOrders,
  getNextDeliveryDate,
};
