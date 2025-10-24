const express = require("express");
const router = express.Router();
const cookAuthMiddleware = require("../middleware/cookAuthMiddleware");
const { validateRequest, validateParams, validateQuery, schemas } = require("../middleware/validationMiddleware");
const {
  getChefOrders,
  getChefOrderById,
  updateOrderStatus,
  addChefNotes,
  getChefOrderStats,
  getChefSchedule,
  getChefAssignedUsers,
} = require("../controllers/chefOrderController");

router.use(cookAuthMiddleware);

router.get("/", validateQuery(schemas.chefOrderSearch), getChefOrders);
router.get("/stats", getChefOrderStats);
router.get("/schedule", validateQuery(schemas.chefSchedule), getChefSchedule);
router.get("/assigned-users", getChefAssignedUsers);
router.get("/:id", validateParams(schemas.objectId), getChefOrderById);
router.patch("/:id/status", validateParams(schemas.objectId), validateRequest(schemas.orderStatusUpdate), updateOrderStatus);
router.patch("/:id/notes", validateParams(schemas.objectId), validateRequest(schemas.chefNotes), addChefNotes);

module.exports = router;
