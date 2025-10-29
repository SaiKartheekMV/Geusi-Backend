const Order = require("../../models/Order");
const Chef = require("../../models/Chef");
const User = require("../../models/user");
const { addNotificationToUser } = require("../notificationService");

const getDashboardStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestsToday = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    const activeChefs = await Chef.countDocuments({
      isAvailable: true,
      accountStatus: "active",
    });

    const deliveriesToday = await Order.countDocuments({
      status: "delivered",
      updatedAt: { $gte: today },
    });

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: firstDayOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$actualPrice" },
        },
      },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const totalAssigned = await Order.countDocuments({
      chef: { $ne: null },
      createdAt: { $gte: firstDayOfMonth },
    });

    const totalRequests = await Order.countDocuments({
      createdAt: { $gte: firstDayOfMonth },
    });

    const acceptanceRate = totalRequests > 0 
      ? Math.round((totalAssigned / totalRequests) * 100) 
      : 0;

    return {
      requestsToday,
      activeChefs,
      deliveriesToday,
      totalRevenue,
      acceptanceRate,
    };
  } catch (error) {
    throw new Error(`Failed to get dashboard stats: ${error.message}`);
  }
};

const getPendingRequests = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const pendingOrders = await Order.find({
      status: "new",
      adminApproved: false,
    })
      .populate("user", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({
      status: "new",
      adminApproved: false,
    });

    return {
      orders: pendingOrders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Failed to get pending requests: ${error.message}`);
  }
};

const getProcessedRequests = async (status, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    let query = {};

    if (status === "approved") {
      query = {
        adminApproved: true,
        status: { $ne: "cancelled" },
      };
    } else if (status === "rejected") {
      query = {
        adminApproved: false,
        rejectionReason: { $exists: true, $ne: null },
      };
    }

    const orders = await Order.find(query)
      .populate("user", "firstName lastName email phone")
      .populate("chef", "firstName lastName phone")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Failed to get processed requests: ${error.message}`);
  }
};

const getChefStatusSummary = async () => {
  try {
    const online = await Chef.countDocuments({
      isAvailable: true,
      accountStatus: "active",
    });

    const offline = await Chef.countDocuments({
      isAvailable: false,
      accountStatus: "active",
    });

    const pendingVerification = await Chef.countDocuments({
      accountStatus: "inactive",
    });

    const total = await Chef.countDocuments();

    return {
      total,
      online,
      offline,
      pendingVerification,
      percentages: {
        online: total > 0 ? Math.round((online / total) * 100) : 0,
        offline: total > 0 ? Math.round((offline / total) * 100) : 0,
        pendingVerification: total > 0 ? Math.round((pendingVerification / total) * 100) : 0,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get chef status: ${error.message}`);
  }
};

const approveRequest = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.adminApproved) {
      throw new Error("Order already approved");
    }

    order.adminApproved = true;
    order.status = "confirmed";
    order.rejectionReason = null;
    await order.save();

    await addNotificationToUser(order.user, {
      message: `Your order for ${order.foodName} has been approved by admin`,
      type: "order_approved",
      meta: { orderId: order._id },
      sendEmail: true,
    });

    return order;
  } catch (error) {
    throw new Error(`Failed to approve request: ${error.message}`);
  }
};

const rejectRequest = async (orderId, rejectionReason) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.adminApproved) {
      throw new Error("Cannot reject approved order");
    }

    order.adminApproved = false;
    order.rejectionReason = rejectionReason || "Rejected by admin";
    order.status = "cancelled";
    await order.save();

    await addNotificationToUser(order.user, {
      message: `Your order for ${order.foodName} has been rejected. Reason: ${order.rejectionReason}`,
      type: "order_rejected",
      meta: { 
        orderId: order._id, 
        reason: order.rejectionReason 
      },
      sendEmail: true,
    });

    return order;
  } catch (error) {
    throw new Error(`Failed to reject request: ${error.message}`);
  }
};

const assignChef = async (orderId, chefId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.adminApproved) {
      throw new Error("Order must be approved first");
    }

    const chef = await Chef.findById(chefId);

    if (!chef) {
      throw new Error("Chef not found");
    }

    if (!chef.isAvailable) {
      throw new Error("Chef is not available");
    }

    if (chef.accountStatus !== "active") {
      throw new Error("Chef account is not active");
    }

    order.chef = chefId;
    order.status = "confirmed";
    await order.save();

    await addNotificationToUser(order.user, {
      message: `Chef ${chef.firstName} ${chef.lastName} has been assigned to your order`,
      type: "chef_assigned",
      meta: { 
        orderId: order._id, 
        chefId: chef._id,
        chefName: `${chef.firstName} ${chef.lastName}`
      },
      sendEmail: true,
    });

    await addNotificationToUser(chefId, {
      message: `New order assigned: ${order.foodName} for ${order.numberOfPersons} persons`,
      type: "order_assigned",
      meta: { 
        orderId: order._id,
        foodName: order.foodName,
        numberOfPersons: order.numberOfPersons
      },
      sendEmail: true,
    });

    return order.populate([
      { path: "user", select: "firstName lastName email phone" },
      { path: "chef", select: "firstName lastName phone" },
    ]);
  } catch (error) {
    throw new Error(`Failed to assign chef: ${error.message}`);
  }
};

module.exports = {
  getDashboardStats,
  getPendingRequests,
  getProcessedRequests,
  getChefStatusSummary,
  approveRequest,
  rejectRequest,
  assignChef,
};