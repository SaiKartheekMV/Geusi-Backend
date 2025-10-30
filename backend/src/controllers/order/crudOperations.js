const Order = require("../../models/order");
const User = require("../../models/user");
const Chef = require("../../models/Chef");
const Assignment = require("../../models/Assignment");
const { sendOrderStatusNotification } = require("../../services/orderNotificationService");
const { addNotificationToUser } = require("../../services/notificationService");
const { sendResponse, sendErrorResponse, asyncHandler, calculatePagination } = require("../../utils/controllerUtils");

const addNotification = async (userId, message, type = "info", meta = {}, sendEmail = false) => {
  return addNotificationToUser(userId, { message, type, meta, sendEmail });
};

const createOrder = asyncHandler(async (req, res) => {
  const {
    foodName,
    description,
    quantity,
    numberOfPersons,
    scheduledDate,
    scheduledTime,
    specialInstructions,
    deliveryAddress,
    estimatedPrice,
    orderType = "individual",
    subscriptionDetails,
  } = req.body;

  if (!foodName || !quantity) {
    return sendErrorResponse(res, 400, "Food name and quantity are required");
  }

  if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
    return sendErrorResponse(res, 400, "Complete delivery address is required");
  }

  let assignment = null;
  let chef = null;

  if (orderType === "subscription") {
    assignment = await Assignment.findOne({
      user: req.user._id,
      status: "active",
      assignmentType: "subscription",
    }).populate("chef");

    if (!assignment) {
      return sendErrorResponse(res, 400, "No active subscription assignment found. Please contact admin for assignment.");
    }

    chef = assignment.chef;
  } else {
    assignment = await Assignment.findOne({
      user: req.user._id,
      status: "active",
      assignmentType: "individual",
    }).populate("chef");

    if (assignment) {
      chef = assignment.chef;
    }
  }

  const orderData = {
    user: req.user._id,
    chef: chef?._id || null,
    assignment: assignment?._id || null,
    foodName,
    description,
    quantity,
    numberOfPersons: numberOfPersons || 1,
    scheduledDate,
    scheduledTime,
    specialInstructions,
    deliveryAddress,
    estimatedPrice: estimatedPrice || 0,
    orderType,
    status: chef ? "confirmed" : "new",
  };

  if (orderType === "subscription" && subscriptionDetails) {
    orderData.subscriptionOrder = {
      isSubscriptionOrder: true,
      subscriptionId: assignment._id,
      deliveryDay: subscriptionDetails.deliveryDay,
      weekNumber: subscriptionDetails.weekNumber,
    };
  }

  const order = new Order(orderData);
  await order.save();

  if (assignment) {
    await assignment.updateOrderStats(estimatedPrice || 0);
  }

  const io = req.app.get("io");
  await sendOrderStatusNotification(req.user._id, chef?._id, order, io);

  const populatedOrder = await Order.findById(order._id)
    .populate("chef", "firstName lastName email phone")
    .populate("assignment", "assignmentType subscriptionDetails");

  return sendResponse(res, 201, { order: populatedOrder }, "Order created successfully");
});

const getOrders = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 10 } = req.query;

  let query = { user: req.user._id };

  if (search) {
    query.$or = [
      { foodName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate("chef", "firstName lastName phone")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);
  const { pagination } = calculatePagination(page, limit, total);

  return sendResponse(res, 200, {
    orders,
    pagination,
  }, "Orders retrieved successfully");
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    user: req.user._id,
  }).populate("chef", "firstName lastName phone profileImage");

  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  return sendResponse(res, 200, { order }, "Order retrieved successfully");
});

const getOrderHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find({
    user: req.user._id,
    status: { $in: ["delivered", "cancelled"] },
  })
    .populate("chef", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Order.countDocuments({
    user: req.user._id,
    status: { $in: ["delivered", "cancelled"] },
  });

  const { pagination } = calculatePagination(page, limit, total);

  return sendResponse(res, 200, {
    orders,
    pagination,
  }, "Order history retrieved successfully");
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderHistory,
};


