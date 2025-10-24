const { addNotificationToUser, markNotificationRead } = require("../services/notificationService");
const User = require("../models/User");
const Chef = require("../models/Chef");

const sendNotificationSelf = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message, type, meta, sendEmail } = req.body;

    const notification = await addNotificationToUser(userId, { message, type, meta, sendEmail });

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("notification", { userId, notification });

    return res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sendNotificationToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message, type, meta, sendEmail } = req.body;

    const notification = await addNotificationToUser(userId, { message, type, meta, sendEmail });

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("notification", { userId, notification });

    return res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notifications");
    return res.status(200).json({ success: true, notifications: user.notifications || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getChefNotifications = async (req, res) => {
  try {
    const chef = await Chef.findById(req.user._id).select("notifications");
    return res.status(200).json({ success: true, notifications: chef.notifications || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notif = await markNotificationRead(userId, notificationId);
    return res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markReadChef = async (req, res) => {
  try {
    const chefId = req.user._id;
    const { notificationId } = req.params;

    const notif = await markNotificationRead(chefId, notificationId);
    return res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  sendNotificationSelf,
  sendNotificationToUser,
  getMyNotifications,
  markRead,
  getChefNotifications,
  markReadChef,
};
