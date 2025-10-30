const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminAuthMiddleware, requirePermission } = require("../middleware/adminAuthMiddleware");
const { validateRequest, validateParams, validateQuery, schemas } = require("../middleware/validationMiddleware");
const {
  createSubscriptionOrders,
  pauseUserSubscription,
  resumeUserSubscription,
  getUserSubscriptionStatus,
  updateUserSubscriptionPreferences,
  getUserSubscriptions,
} = require("../controllers/subscriptionController");


router.get("/", authMiddleware, validateQuery(schemas.pagination), getUserSubscriptions);
router.get("/:assignmentId/status", authMiddleware, validateParams(schemas.objectId), getUserSubscriptionStatus);
router.patch("/:assignmentId/preferences", authMiddleware, validateParams(schemas.objectId), validateRequest(schemas.subscriptionPreferences), updateUserSubscriptionPreferences);


router.use(adminAuthMiddleware);
router.use(requirePermission("assignmentManagement"));

router.post("/generate-orders", validateRequest(schemas.subscriptionOrderGeneration), createSubscriptionOrders);
router.patch("/:assignmentId/pause", validateParams(schemas.objectId), validateRequest(schemas.subscriptionPause), pauseUserSubscription);
router.patch("/:assignmentId/resume", validateParams(schemas.objectId), resumeUserSubscription);

module.exports = router;
