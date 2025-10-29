const {
  generateSubscriptionOrders,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionStatus,
  updateSubscriptionPreferences,
} = require("../services/subscriptionService");
const { sendResponse, sendErrorResponse, asyncHandler, calculatePagination } = require("../utils/controllerUtils");
const Assignment = require("../models/Assignment");

const createSubscriptionOrders = asyncHandler(async (req, res) => {
  const { assignmentId, startDate, endDate } = req.body;

  const result = await generateSubscriptionOrders(assignmentId, startDate, endDate);

  if (!result.success) {
    return sendErrorResponse(res, 400, "Failed to generate subscription orders", result.error);
  }

  return sendResponse(res, 201, {
    ordersCreated: result.ordersCreated,
    orders: result.orders,
  }, "Subscription orders generated successfully");
});

const pauseUserSubscription = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { reason } = req.body;

  const result = await pauseSubscription(assignmentId, reason);

  if (!result.success) {
    return sendErrorResponse(res, 400, "Failed to pause subscription", result.error);
  }

  return sendResponse(res, 200, null, result.message);
});

const resumeUserSubscription = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const result = await resumeSubscription(assignmentId);

  if (!result.success) {
    return sendErrorResponse(res, 400, "Failed to resume subscription", result.error);
  }

  return sendResponse(res, 200, {
    ordersGenerated: result.ordersGenerated,
  }, result.message);
});

const getUserSubscriptionStatus = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const result = await getSubscriptionStatus(assignmentId);

  if (!result.success) {
    return sendErrorResponse(res, 400, "Failed to get subscription status", result.error);
  }

  return sendResponse(res, 200, {
    subscription: result.assignment,
    orderStats: result.orderStats,
    upcomingOrders: result.upcomingOrders,
    totalOrders: result.totalOrders,
  }, "Subscription status retrieved successfully");
});

const updateUserSubscriptionPreferences = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { preferences } = req.body;

  const result = await updateSubscriptionPreferences(assignmentId, preferences);

  if (!result.success) {
    return sendErrorResponse(res, 400, "Failed to update subscription preferences", result.error);
  }

  return sendResponse(res, 200, {
    preferences: result.preferences,
  }, result.message);
});

const getUserSubscriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const subscriptions = await Assignment.find({
    user: req.user._id,
    assignmentType: "subscription",
  })
    .populate("chef", "firstName lastName email phone cuisineSpecialty rating")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Assignment.countDocuments({
    user: req.user._id,
    assignmentType: "subscription",
  });

  const { pagination } = calculatePagination(page, limit, total);

  return sendResponse(res, 200, {
    subscriptions,
    pagination,
  }, "Subscriptions retrieved successfully");
});

module.exports = {
  createSubscriptionOrders,
  pauseUserSubscription,
  resumeUserSubscription,
  getUserSubscriptionStatus,
  updateUserSubscriptionPreferences,
  getUserSubscriptions,
};
