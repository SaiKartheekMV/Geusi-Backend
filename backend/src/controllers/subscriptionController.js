const {
  generateSubscriptionOrders,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionStatus,
  updateSubscriptionPreferences,
} = require("../services/subscriptionService");

const createSubscriptionOrders = async (req, res) => {
  try {
    const { assignmentId, startDate, endDate } = req.body;

    const result = await generateSubscriptionOrders(assignmentId, startDate, endDate);

    if (!result.success) {
      return res.status(400).json({
        message: "Failed to generate subscription orders",
        error: result.error,
      });
    }

    res.status(201).json({
      message: "Subscription orders generated successfully",
      ordersCreated: result.ordersCreated,
      orders: result.orders,
    });
  } catch (error) {
    console.error("Create subscription orders error:", error);
    res.status(500).json({
      message: "Failed to create subscription orders",
      error: error.message,
    });
  }
};

const pauseUserSubscription = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body;

    const result = await pauseSubscription(assignmentId, reason);

    if (!result.success) {
      return res.status(400).json({
        message: "Failed to pause subscription",
        error: result.error,
      });
    }

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    console.error("Pause subscription error:", error);
    res.status(500).json({
      message: "Failed to pause subscription",
      error: error.message,
    });
  }
};

const resumeUserSubscription = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await resumeSubscription(assignmentId);

    if (!result.success) {
      return res.status(400).json({
        message: "Failed to resume subscription",
        error: result.error,
      });
    }

    res.status(200).json({
      message: result.message,
      ordersGenerated: result.ordersGenerated,
    });
  } catch (error) {
    console.error("Resume subscription error:", error);
    res.status(500).json({
      message: "Failed to resume subscription",
      error: error.message,
    });
  }
};

const getUserSubscriptionStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await getSubscriptionStatus(assignmentId);

    if (!result.success) {
      return res.status(400).json({
        message: "Failed to get subscription status",
        error: result.error,
      });
    }

    res.status(200).json({
      subscription: result.assignment,
      orderStats: result.orderStats,
      upcomingOrders: result.upcomingOrders,
      totalOrders: result.totalOrders,
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({
      message: "Failed to get subscription status",
      error: error.message,
    });
  }
};

const updateUserSubscriptionPreferences = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { preferences } = req.body;

    const result = await updateSubscriptionPreferences(assignmentId, preferences);

    if (!result.success) {
      return res.status(400).json({
        message: "Failed to update subscription preferences",
        error: result.error,
      });
    }

    res.status(200).json({
      message: result.message,
      preferences: result.preferences,
    });
  } catch (error) {
    console.error("Update subscription preferences error:", error);
    res.status(500).json({
      message: "Failed to update subscription preferences",
      error: error.message,
    });
  }
};

const getUserSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const Assignment = require("../models/Assignment");

    const subscriptions = await Assignment.find({
      user: req.user._id,
      assignmentType: "subscription",
    })
      .populate("chef", "firstName lastName email phone cuisineSpecialty rating")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments({
      user: req.user._id,
      assignmentType: "subscription",
    });

    res.status(200).json({
      subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user subscriptions error:", error);
    res.status(500).json({
      message: "Failed to get user subscriptions",
      error: error.message,
    });
  }
};

module.exports = {
  createSubscriptionOrders,
  pauseUserSubscription,
  resumeUserSubscription,
  getUserSubscriptionStatus,
  updateUserSubscriptionPreferences,
  getUserSubscriptions,
};
