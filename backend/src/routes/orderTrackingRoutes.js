const express = require("express");
const router = express.Router();
const { getOrderTracking, updateOrderLocation } = require("../controllers/orderTrackingController");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/:orderId", authMiddleware, getOrderTracking);


router.put("/:orderId/location", authMiddleware, updateOrderLocation);

module.exports = router;
