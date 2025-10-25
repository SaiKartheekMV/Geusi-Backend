const Assignment = require("../../models/Assignment");
const Order = require("../../models/Order");

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

module.exports = {
  getSubscriptionStatus,
};
