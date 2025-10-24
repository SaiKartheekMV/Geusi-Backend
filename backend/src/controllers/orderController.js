const Order = require("../models/Order");
const User = require("../models/User");
const Chef = require("../models/Chef");
const Assignment = require("../models/Assignment");
const { sendOrderStatusNotification } = require("../services/orderNotificationService");
const { addNotificationToUser } = require("../services/notificationService");

// Small adapter so controllers can call addNotification(userId, message, type)
const addNotification = async (userId, message, type = "info", meta = {}, sendEmail = false) => {
  return addNotificationToUser(userId, { message, type, meta, sendEmail });
};

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
      orderType = "individual",
      subscriptionDetails,
    } = req.body;

    if (!foodName || !quantity) {
      return res.status(400).json({ message: "Food name and quantity are required" });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return res.status(400).json({ message: "Complete delivery address is required" });
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
        return res.status(400).json({
          message: "No active subscription assignment found. Please contact admin for assignment.",
        });
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

    // Send notifications using the new service
    const io = req.app.get("io");
    await sendOrderStatusNotification(req.user._id, chef?._id, order, io);

    const populatedOrder = await Order.findById(order._id)
      .populate("chef", "firstName lastName email phone")
      .populate("assignment", "assignmentType subscriptionDetails");

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
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

const assignOrderToChef = async (req, res) => {
  try {
    const { orderId, chefId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.chef) {
      return res.status(400).json({ message: "Order is already assigned to a chef" });
    }

    const assignment = await Assignment.findOne({
      user: order.user,
      chef: chefId,
      status: "active",
    });

    if (!assignment) {
      return res.status(400).json({ 
        message: "No active assignment found between user and chef" 
      });
    }

    const chef = await Chef.findById(chefId);
    if (!chef || !chef.isAvailable) {
      return res.status(400).json({ 
        message: "Chef is not available for new orders" 
      });
    }

    order.chef = chefId;
    order.assignment = assignment._id;
    await order.updateStatus("confirmed", "admin", "Order assigned by admin");

    await addNotification(
      order.user,
      `Your order for ${order.foodName} has been assigned to Chef ${chef.firstName} ${chef.lastName}`,
      "order_assigned"
    );

    await addNotification(
      chefId,
      `New order assigned: ${order.foodName} from ${order.user.firstName} ${order.user.lastName}`,
      "order_assigned"
    );

    const populatedOrder = await Order.findById(order._id)
      .populate("chef", "firstName lastName email phone")
      .populate("assignment", "assignmentType subscriptionDetails");

    res.status(200).json({
      message: "Order assigned to chef successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Assign order error:", error);
    res.status(500).json({ message: "Failed to assign order", error: error.message });
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
  createOrder,
  getOrders,
  getOrderById,
  getOrderHistory,
  cancelOrder,
  deleteOrder,
  getNotifications,
  markNotificationRead,
  assignOrderToChef,
  rateOrder,
  getOrderTimeline,
};