const Order = require("../models/Order");
const User = require("../models/User");
const Chef = require("../models/Chef");

// Helper function to add notification
const addNotification = async (userId, message, type) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          message,
          type,
          isRead: false,
          createdAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Notification error:", error);
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
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
    } = req.body;

    if (!foodName || !quantity) {
      return res.status(400).json({ message: "Food name and quantity are required" });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return res.status(400).json({ message: "Complete delivery address is required" });
    }

    const order = new Order({
      user: req.user._id,
      foodName,
      description,
      quantity,
      numberOfPersons: numberOfPersons || 1,
      scheduledDate,
      scheduledTime,
      specialInstructions,
      deliveryAddress,
      estimatedPrice: estimatedPrice || 0,
      status: "new",
    });

    await order.save();

    // Add notification to user
    await addNotification(
      req.user._id,
      `Your order for ${foodName} has been placed successfully`,
      "order_created"
    );

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// Get all orders (with search and filters)
const getOrders = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    let query = { user: req.user._id };

    // Search by food name or description (simple string matching)
    if (search) {
      query.$or = [
        { foodName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate("chef", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Failed to get orders", error: error.message });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    }).populate("chef", "firstName lastName phone profileImage");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Failed to get order", error: error.message });
  }
};

// Get order history (delivered/cancelled)
const getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({
      user: req.user._id,
      status: { $in: ["delivered", "cancelled"] },
    })
      .populate("chef", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({
      user: req.user._id,
      status: { $in: ["delivered", "cancelled"] },
    });

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ message: "Failed to get order history", error: error.message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body || {};

    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({ message: "Cannot cancel this order" });
    }

    order.status = "cancelled";
    order.cancelReason = cancelReason || "Cancelled by user";
    order.cancelledBy = "user";
    await order.save();

    // Notify user
    await addNotification(
      req.user._id,
      `Your order for ${order.foodName} has been cancelled`,
      "order_cancelled"
    );

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Failed to cancel order", error: error.message });
  }
};

// Delete order (only if cancelled)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow deletion of cancelled orders
    if (order.status !== "cancelled") {
      return res.status(400).json({ 
        message: "Can only delete cancelled orders. Please cancel the order first." 
      });
    }

    await Order.findByIdAndDelete(id);

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};

// Get user notifications
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

// Mark notification as read
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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderHistory,
  cancelOrder,
  deleteOrder,
  getNotifications,
  markNotificationRead,
};