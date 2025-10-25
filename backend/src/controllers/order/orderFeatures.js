const Order = require("../../models/Order");
const User = require("../../models/User");
const Chef = require("../../models/Chef");

const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notifications");

    const notifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to get notifications", error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
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

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({ message: "Failed to mark notification", error: error.message });
  }
};

const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: "delivered",
    });

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found or not delivered" 
      });
    }

    if (order.userRating && order.userRating.rating) {
      return res.status(400).json({ 
        message: "Order has already been rated" 
      });
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

    res.status(200).json({
      message: "Order rated successfully",
      order,
    });
  } catch (error) {
    console.error("Rate order error:", error);
    res.status(500).json({ message: "Failed to rate order", error: error.message });
  }
};

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

const getOrderTimeline = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    }).select("orderTimeline foodName status");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      orderId: order._id,
      foodName: order.foodName,
      currentStatus: order.status,
      timeline: order.orderTimeline,
    });
  } catch (error) {
    console.error("Get order timeline error:", error);
    res.status(500).json({ message: "Failed to get order timeline", error: error.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  rateOrder,
  getOrderTimeline,
};
