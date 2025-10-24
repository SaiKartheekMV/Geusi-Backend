const express = require("express");
const router = express.Router();
const { getOrderTracking, updateOrderLocation } = require("../controllers/orderTrackingController");
const authMiddleware = require("../middleware/authMiddleware");

// Get tracking information for a specific order
router.get("/:orderId", authMiddleware, getOrderTracking);

// Update the current location of an order (for chef use)
router.put("/:orderId/location", authMiddleware, updateOrderLocation);

module.exports = router;