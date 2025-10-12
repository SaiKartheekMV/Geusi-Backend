const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createOrder,
  getOrders,
  getOrderById,
  getOrderHistory,
  cancelOrder,
  deleteOrder,
  getNotifications,
  markNotificationRead,
  updateOrderStatus,
} = require("../controllers/orderController");

// All routes require authentication
router.use(authMiddleware);

// Order routes
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/history", getOrderHistory);
router.get("/notifications", getNotifications);
router.patch("/notifications/:notificationId/read", markNotificationRead);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus); // NEW: Update status
router.patch("/:id/cancel", cancelOrder);
router.delete("/:id", deleteOrder);

module.exports = router;