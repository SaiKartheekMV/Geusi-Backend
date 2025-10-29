const Order = require("../models/order");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../utils/controllerUtils");

const getOrderTracking = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    

    const order = await Order.findById(orderId)
      .populate("chef", "firstName lastName phone email")
      .select("status orderTimeline deliveryAddress preparationTime deliveryTime");
    
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }
    

    if (order.user.toString() !== req.user._id.toString() && 
        order.chef?._id.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return sendErrorResponse(res, 403, "Not authorized to view this order");
    }
    

    const currentLocation = order.status === "onTheWay" && order.orderTimeline.length > 0 
      ? order.orderTimeline[order.orderTimeline.length - 1].location 
      : null;
    

    const estimatedArrival = order.status === "onTheWay" && order.orderTimeline.length > 0
      ? order.orderTimeline[order.orderTimeline.length - 1].estimatedArrival
      : null;
    
    return sendResponse(res, 200, {
      status: order.status,
      timeline: order.orderTimeline,
      currentLocation,
      estimatedArrival,
      deliveryAddress: order.deliveryAddress,
      chef: order.chef,
      preparationTime: order.preparationTime,
      deliveryTime: order.deliveryTime
    }, "Order tracking retrieved successfully");
});

const updateOrderLocation = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { latitude, longitude, address, estimatedArrival } = req.body;
    

    const order = await Order.findById(orderId);
    
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }
    

    if (order.chef.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, "Not authorized to update this order");
    }
    

    if (order.status !== "onTheWay") {
      return sendErrorResponse(res, 400, "Location can only be updated when order is on the way");
    }
    

    const location = {
      latitude,
      longitude,
      address
    };
    

    let estimatedArrivalDate = null;
    if (estimatedArrival) {
      estimatedArrivalDate = new Date(estimatedArrival);
    }
    

    await order.updateStatus(order.status, "chef", "Location updated", location, estimatedArrivalDate);
    

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${order.user.toString()}`).emit("orderLocationUpdate", {
        orderId: order._id,
        location,
        estimatedArrival: estimatedArrivalDate
      });
    }
    
    return sendResponse(res, 200, null, "Order location updated successfully");
});

module.exports = {
  getOrderTracking,
  updateOrderLocation
};
