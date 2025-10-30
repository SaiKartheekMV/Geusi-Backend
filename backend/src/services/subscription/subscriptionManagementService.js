const Assignment = require("../../models/Assignment");
const Order = require("../../models/order");
const { generateSubscriptionOrders } = require("./orderGenerationService");

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

module.exports = {
  pauseSubscription,
  resumeSubscription,
};
