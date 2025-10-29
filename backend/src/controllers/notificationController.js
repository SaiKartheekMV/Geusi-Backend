const { addNotificationToUser, markNotificationRead } = require("../services/notificationService");
const User = require("../models/user");
const Chef = require("../models/Chef");
const { sendResponse, sendErrorResponse, asyncHandler } = require("../utils/controllerUtils");

const sendNotificationSelf = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { message, type, meta, sendEmail } = req.body;

  const notification = await addNotificationToUser(userId, { message, type, meta, sendEmail });

  const io = req.app.get("io");
  if (io) io.to(`user_${userId}`).emit("notification", { userId, notification });

  return sendResponse(res, 201, { notification }, "Notification sent successfully");
});

const sendNotificationToUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { message, type, meta, sendEmail } = req.body;

  const notification = await addNotificationToUser(userId, { message, type, meta, sendEmail });

  const io = req.app.get("io");
  if (io) io.to(`user_${userId}`).emit("notification", { userId, notification });

  return sendResponse(res, 201, { notification }, "Notification sent successfully");
});

const getMyNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("notifications");
  return sendResponse(res, 200, { notifications: user.notifications || [] }, "Notifications retrieved successfully");
});

const getChefNotifications = asyncHandler(async (req, res) => {
  const chef = await Chef.findById(req.user._id).select("notifications");
  return sendResponse(res, 200, { notifications: chef.notifications || [] }, "Notifications retrieved successfully");
});

const markRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const notification = await markNotificationRead(userId, notificationId);
  return sendResponse(res, 200, { notification }, "Notification marked as read");
});

const markReadChef = asyncHandler(async (req, res) => {
  const chefId = req.user._id;
  const { notificationId } = req.params;

  const notification = await markNotificationRead(chefId, notificationId);
  return sendResponse(res, 200, { notification }, "Notification marked as read");
});

module.exports = {
  sendNotificationSelf,
  sendNotificationToUser,
  getMyNotifications,
  markRead,
  getChefNotifications,
  markReadChef,
};
