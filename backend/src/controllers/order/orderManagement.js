const Order = require("../../models/order");
const User = require("../../models/user");
const Chef = require("../../models/Chef");
const Assignment = require("../../models/Assignment");
const { addNotificationToUser } = require("../../services/notificationService");
const { sendResponse, sendErrorResponse, asyncHandler } = require("../../utils/controllerUtils");

const addNotification = async (userId, message, type = "info", meta = {}, sendEmail = false) => {
  return addNotificationToUser(userId, { message, type, meta, sendEmail });
};

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body || {};

  const order = await Order.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  if (order.status === "delivered" || order.status === "cancelled") {
    return sendErrorResponse(res, 400, "Cannot cancel this order");
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

  return sendResponse(res, 200, { order }, "Order cancelled successfully");
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  if (order.status !== "cancelled") {
    return sendErrorResponse(res, 400, "Can only delete cancelled orders. Please cancel the order first.");
  }

  await Order.findByIdAndDelete(id);

  return sendResponse(res, 200, null, "Order deleted successfully");
});

const assignOrderToChef = asyncHandler(async (req, res) => {
  const { orderId, chefId } = req.body;

  const order = await Order.findById(orderId).populate("user", "firstName lastName");
  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  if (order.chef) {
    return sendErrorResponse(res, 400, "Order is already assigned to a chef");
  }

  const assignment = await Assignment.findOne({
    user: order.user,
    chef: chefId,
    status: "active",
  });

  if (!assignment) {
    return sendErrorResponse(res, 400, "No active assignment found between user and chef");
  }

  const chef = await Chef.findById(chefId);
  if (!chef || !chef.isAvailable) {
    return sendErrorResponse(res, 400, "Chef is not available for new orders");
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

  return sendResponse(res, 200, { order: populatedOrder }, "Order assigned to chef successfully");
});

module.exports = {
  cancelOrder,
  deleteOrder,
  assignOrderToChef,
};


