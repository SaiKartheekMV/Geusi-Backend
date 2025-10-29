const Assignment = require("../../models/Assignment");
const Order = require("../../models/order");

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

    const createdOrders = [];
    const errors = [];

    for (const od of orders) {
      try {
        const o = new Order(od);
        const saved = await o.save();
        createdOrders.push(saved);
      } catch (err) {
        errors.push({ order: od, error: err.message });
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

module.exports = {
  generateSubscriptionOrders,
  getNextDeliveryDate,
};
