const Order = require("../models/order");
const User = require("../models/user");
const Assignment = require("../models/Assignment");
const { sendOrderStatusNotification } = require("../services/orderNotificationService");
const { sendResponse, sendErrorResponse, asyncHandler, calculatePagination } = require("../utils/controllerUtils");

const getChefOrders = asyncHandler(async (req, res) => {
  const { status, orderType, page = 1, limit = 10 } = req.query;

  let query = { chef: req.user._id };

  if (status) {
    query.status = status;
  }

  if (orderType) {
    query.orderType = orderType;
  }

  const orders = await Order.find(query)
    .populate("user", "firstName lastName email phone")
    .populate("assignment", "assignmentType subscriptionDetails")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);
  const { pagination } = calculatePagination(page, limit, total);

  return sendResponse(res, 200, {
    orders,
    pagination,
  }, "Chef orders retrieved successfully");
});

const getChefOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    chef: req.user._id,
  })
    .populate("user", "firstName lastName email phone preferences")
    .populate("assignment", "assignmentType subscriptionDetails notes")
    .populate("chef", "firstName lastName email phone cuisineSpecialty");

  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  return sendResponse(res, 200, { order }, "Order retrieved successfully");
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, preparationTime, deliveryTime, location, estimatedArrival } = req.body;

  const order = await Order.findOne({
    _id: id,
    chef: req.user._id,
  });

  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  if (!order.canBeUpdatedByChef()) {
    return sendErrorResponse(res, 400, "Order cannot be updated in current status");
  }

  const validTransitions = {
    confirmed: ["preparing"],
    preparing: ["onTheWay"],
    onTheWay: ["delivered"],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return sendErrorResponse(res, 400, `Invalid status transition from ${order.status} to ${status}`);
  }

  let locationData = null;
  if (location) {
    locationData = {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    };
  }

  let estimatedArrivalDate = null;
  if (estimatedArrival) {
    estimatedArrivalDate = new Date(estimatedArrival);
  }

  await order.updateStatus(status, "chef", notes, locationData, estimatedArrivalDate);
  
  if (preparationTime) {
    order.preparationTime.actualMinutes = preparationTime;
  }

  if (deliveryTime) {
    order.deliveryTime.actualMinutes = deliveryTime;
  }

  await order.save();

  const io = req.app.get("io");
  await sendOrderStatusNotification(order.user, req.user._id, order, io);

  const updatedOrder = await Order.findById(order._id)
    .populate("user", "firstName lastName email phone")
    .populate("assignment", "assignmentType subscriptionDetails");

  return sendResponse(res, 200, { order: updatedOrder }, "Order status updated successfully");
});

const addChefNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const order = await Order.findOne({
    _id: id,
    chef: req.user._id,
  });

  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  order.chefNotes = notes;
  await order.save();

  return sendResponse(res, 200, { order }, "Chef notes added successfully");
});

const getChefOrderStats = asyncHandler(async (req, res) => {
  const chefId = req.user._id;

  const stats = await Order.aggregate([
    { $match: { chef: chefId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$actualPrice" },
      },
    },
  ]);

  const totalOrders = await Order.countDocuments({ chef: chefId });
  const completedOrders = await Order.countDocuments({
    chef: chefId,
    status: "delivered",
  });
  const activeOrders = await Order.countDocuments({
    chef: chefId,
    status: { $in: ["confirmed", "preparing", "onTheWay"] },
  });

  const averageRating = await Order.aggregate([
    { $match: { chef: chefId, "userRating.rating": { $exists: true } } },
    { $group: { _id: null, avgRating: { $avg: "$userRating.rating" } } },
  ]);

  return sendResponse(res, 200, {
    stats,
    summary: {
      totalOrders,
      completedOrders,
      activeOrders,
      averageRating: averageRating[0]?.avgRating || 0,
    },
  }, "Chef order statistics retrieved successfully");
});

const getChefSchedule = asyncHandler(async (req, res) => {
  const { date, week } = req.query;
  const chefId = req.user._id;

  let query = { chef: chefId };

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    query.scheduledDate = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  if (week) {
    const weekStart = new Date(week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    query.scheduledDate = {
      $gte: weekStart,
      $lt: weekEnd,
    };
  }

  const orders = await Order.find(query)
    .populate("user", "firstName lastName phone")
    .populate("assignment", "assignmentType")
    .sort({ scheduledDate: 1 });

  const schedule = orders.map(order => ({
    orderId: order._id,
    user: order.user,
    foodName: order.foodName,
    scheduledDate: order.scheduledDate,
    scheduledTime: order.scheduledTime,
    status: order.status,
    orderType: order.orderType,
    assignmentType: order.assignment?.assignmentType,
    estimatedDeliveryTime: order.getEstimatedDeliveryTime(),
  }));

  return sendResponse(res, 200, {
    schedule,
    totalOrders: orders.length,
  }, "Chef schedule retrieved successfully");
});

const getChefAssignedUsers = asyncHandler(async (req, res) => {
  const chefId = req.user._id;

  const assignments = await Assignment.find({
    chef: chefId,
    status: "active",
  })
    .populate("user", "firstName lastName email phone preferences householdSize")
    .select("user assignmentType subscriptionDetails startDate notes");

  const assignedUsers = assignments.map(assignment => ({
    userId: assignment.user._id,
    user: assignment.user,
    assignmentType: assignment.assignmentType,
    subscriptionDetails: assignment.subscriptionDetails,
    startDate: assignment.startDate,
    notes: assignment.notes,
  }));

  return sendResponse(res, 200, {
    assignedUsers,
    totalAssigned: assignedUsers.length,
  }, "Assigned users retrieved successfully");
});

module.exports = {
  getChefOrders,
  getChefOrderById,
  updateOrderStatus,
  addChefNotes,
  getChefOrderStats,
  getChefSchedule,
  getChefAssignedUsers,
};
