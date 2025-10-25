const Order = require("../../models/Order");
const User = require("../../models/User");
const Chef = require("../../models/Chef");
const Assignment = require("../../models/Assignment");
const { addNotificationToUser } = require("../../services/notificationService");

const addNotification = async (userId, message, type = "info", meta = {}, sendEmail = false) => {
  return addNotificationToUser(userId, { message, type, meta, sendEmail });
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

module.exports = {
  cancelOrder,
  deleteOrder,
  assignOrderToChef,
};
