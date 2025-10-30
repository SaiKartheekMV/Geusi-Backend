const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const cookAuthMiddleware = require("../middleware/cookAuthMiddleware");
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware");
const getChefNotifications = require("../controllers/notificationController").getChefNotifications;
const markReadChef = require("../controllers/notificationController").markReadChef;
const {
  sendNotificationSelf,
  sendNotificationToUser,
  getMyNotifications,
  markRead,
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getMyNotifications);
router.get("/chef", cookAuthMiddleware, getChefNotifications);

router.post("/send/self", authMiddleware, sendNotificationSelf);

router.post("/read/:notificationId", authMiddleware, markRead);
router.post("/chef/read/:notificationId", cookAuthMiddleware, markReadChef);

router.post("/send/:userId", adminAuthMiddleware, sendNotificationToUser);

module.exports = router;
