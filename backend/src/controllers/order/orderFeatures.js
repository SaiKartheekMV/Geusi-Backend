const Order = require("../../models/order");
const User = require("../../models/user");
const Chef = require("../../models/Chef");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../../utils/controllerUtils");

const getNotifications = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("notifications");

    const notifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);

    return sendResponse(res, 200, { notifications }, "Notifications retrieved successfully");
});

const markNotificationRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "notifications._id": notificationId,
      },
      {
        $set: { "notifications.$.isRead": true },
      }
    );

    return sendResponse(res, 200, null, "Notification marked as read");
});

const rateOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return sendErrorResponse(res, 400, "Rating must be between 1 and 5");
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: "delivered",
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found or not delivered");
    }

    if (order.userRating && order.userRating.rating) {
      return sendErrorResponse(res, 400, "Order has already been rated");
    }

    order.userRating = {
      rating,
      review: review || "",
      ratedAt: new Date(),
    };

    await order.save();

    if (order.chef) {
      await updateChefRating(order.chef);
    }

    return sendResponse(res, 200, { order }, "Order rated successfully");
});

const updateChefRating = async (chefId) => {
  try {
    const ratings = await Order.aggregate([
      { $match: { chef: chefId, "userRating.rating": { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: "$userRating.rating" } } },
    ]);

    if (ratings.length > 0) {
      await Chef.findByIdAndUpdate(chefId, {
        rating: Math.round(ratings[0].avgRating * 10) / 10,
      });
    }
  } catch (error) {
    console.error("Update chef rating error:", error);
  }
};

const getOrderTimeline = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    }).select("orderTimeline foodName status");

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    return sendResponse(res, 200, {
      orderId: order._id,
      foodName: order.foodName,
      currentStatus: order.status,
      timeline: order.orderTimeline,
    }, "Order timeline retrieved successfully");
});

module.exports = {
  getNotifications,
  markNotificationRead,
  rateOrder,
  getOrderTimeline,
};


