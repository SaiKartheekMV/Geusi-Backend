const Order = require("../../models/Order");
const User = require("../../models/User");
const Chef = require("../../models/Chef");
const Assignment = require("../../models/Assignment");
const { sendOrderStatusNotification } = require("../../services/orderNotificationService");
const { addNotificationToUser } = require("../../services/notificationService");

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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderHistory,
};
