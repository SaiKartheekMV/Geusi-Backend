const Order = require("../models/Order");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const { sendOrderStatusNotification } = require("../services/orderNotificationService");

const getChefOrders = async (req, res) => {
  try {
    const { status, orderType, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

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
    console.error("Get chef orders error:", error);
    res.status(500).json({
      message: "Failed to get chef orders",
      error: error.message,
    });
  }
};

const getChefOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      chef: req.user._id,
    })
      .populate("user", "firstName lastName email phone preferences")
      .populate("assignment", "assignmentType subscriptionDetails notes")
      .populate("chef", "firstName lastName email phone cuisineSpecialty");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Get chef order error:", error);
    res.status(500).json({
      message: "Failed to get order",
      error: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, preparationTime, deliveryTime, location, estimatedArrival } = req.body;

    const order = await Order.findOne({
      _id: id,
      chef: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (!order.canBeUpdatedByChef()) {
      return res.status(400).json({
        message: "Order cannot be updated in current status",
      });
    }

    const validTransitions = {
      confirmed: ["preparing"],
      preparing: ["onTheWay"],
      onTheWay: ["delivered"],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${order.status} to ${status}`,
      });
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

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

const addChefNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const order = await Order.findOne({
      _id: id,
      chef: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.chefNotes = notes;
    await order.save();

    res.status(200).json({
      message: "Chef notes added successfully",
      order,
    });
  } catch (error) {
    console.error("Add chef notes error:", error);
    res.status(500).json({
      message: "Failed to add chef notes",
      error: error.message,
    });
  }
};

const getChefOrderStats = async (req, res) => {
  try {
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

    res.status(200).json({
      stats,
      summary: {
        totalOrders,
        completedOrders,
        activeOrders,
        averageRating: averageRating[0]?.avgRating || 0,
      },
    });
  } catch (error) {
    console.error("Get chef order stats error:", error);
    res.status(500).json({
      message: "Failed to get chef order statistics",
      error: error.message,
    });
  }
};

const getChefSchedule = async (req, res) => {
  try {
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

    res.status(200).json({
      schedule,
      totalOrders: orders.length,
    });
  } catch (error) {
    console.error("Get chef schedule error:", error);
    res.status(500).json({
      message: "Failed to get chef schedule",
      error: error.message,
    });
  }
};

const getChefAssignedUsers = async (req, res) => {
  try {
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

    res.status(200).json({
      assignedUsers,
      totalAssigned: assignedUsers.length,
    });
  } catch (error) {
    console.error("Get chef assigned users error:", error);
    res.status(500).json({
      message: "Failed to get assigned users",
      error: error.message,
    });
  }
};

module.exports = {
  getChefOrders,
  getChefOrderById,
  updateOrderStatus,
  addChefNotes,
  getChefOrderStats,
  getChefSchedule,
  getChefAssignedUsers,
};
