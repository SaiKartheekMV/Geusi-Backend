const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { validateRequest, validateParams, validateQuery, schemas } = require("../middleware/validationMiddleware");
const {
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
} = require("../controllers/orderController");

router.use(authMiddleware);

router.post("/", validateRequest(schemas.orderCreation), createOrder);
router.get("/", validateQuery(schemas.orderSearch), getOrders);
router.get("/history", validateQuery(schemas.pagination), getOrderHistory);
router.get("/notifications", getNotifications);
router.patch("/notifications/:notificationId/read", validateParams(schemas.objectId), markNotificationRead);
router.post("/assign", validateRequest(schemas.orderAssignment), assignOrderToChef);
router.get("/:id", validateParams(schemas.objectId), getOrderById);
router.get("/:id/timeline", validateParams(schemas.objectId), getOrderTimeline);
router.patch("/:id/cancel", validateParams(schemas.objectId), validateRequest(schemas.orderUpdate), cancelOrder);
router.patch("/:id/rate", validateParams(schemas.objectId), validateRequest(schemas.orderRating), rateOrder);
router.delete("/:id", validateParams(schemas.objectId), deleteOrder);

module.exports = router;
