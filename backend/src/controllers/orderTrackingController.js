const Order = require("../models/Order");

/**
 * Get tracking information for a specific order
 */
const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    

    const order = await Order.findById(orderId)
      .populate("chef", "firstName lastName phone email")
      .select("status orderTimeline deliveryAddress preparationTime deliveryTime");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    

    if (order.user.toString() !== req.user._id.toString() && 
        order.chef?._id.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    

    const currentLocation = order.status === "onTheWay" && order.orderTimeline.length > 0 
      ? order.orderTimeline[order.orderTimeline.length - 1].location 
      : null;
    

    const estimatedArrival = order.status === "onTheWay" && order.orderTimeline.length > 0
      ? order.orderTimeline[order.orderTimeline.length - 1].estimatedArrival
      : null;
    
    return res.status(200).json({
      status: order.status,
      timeline: order.orderTimeline,
      currentLocation,
      estimatedArrival,
      deliveryAddress: order.deliveryAddress,
      chef: order.chef,
      preparationTime: order.preparationTime,
      deliveryTime: order.deliveryTime
    });
  } catch (error) {
    console.error("Error getting order tracking:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update the current location of an order (for chef use)
 */
const updateOrderLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude, address, estimatedArrival } = req.body;
    

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    

    if (order.chef.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }
    

    if (order.status !== "onTheWay") {
      return res.status(400).json({ message: "Location can only be updated when order is on the way" });
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
    
    return res.status(200).json({ message: "Order location updated successfully" });
  } catch (error) {
    console.error("Error updating order location:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOrderTracking,
  updateOrderLocation
};
