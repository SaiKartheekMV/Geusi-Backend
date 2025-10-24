const nodemailer = require("nodemailer");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Chef = require("../models/Chef");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const addNotificationToUser = async (userId, { message, type = "info", meta = {}, sendEmail = false }) => {
  // Try to add notification to User, Admin, or Chef documents.
  const models = [
    { name: 'User', model: User },
    { name: 'Admin', model: Admin },
    { name: 'Chef', model: Chef },
  ];

  let target = null;
  let targetModelName = null;
  for (const m of models) {
    const doc = await m.model.findById(userId);
    if (doc) {
      target = doc;
      targetModelName = m.name;
      break;
    }
  }

  if (!target) throw new Error('User not found');

  const notification = {
    message,
    type,
    isRead: false,
    createdAt: new Date(),
    meta,
  };

  // Ensure notifications array exists on the target
  target.notifications = target.notifications || [];
  target.notifications.unshift(notification);
  await target.save();

  if (sendEmail && target.email) {
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: target.email,
      subject: `New notification: ${type}`,
      text: message,
      html: `<p>${message}</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error("Failed to send notification email:", err.message);
    }
  }

  return notification;
};

const markNotificationRead = async (userId, notificationId) => {
  const models = [User, Admin, Chef];

  for (const model of models) {
    const doc = await model.findById(userId);
    if (!doc) continue;
    const notif = doc.notifications.id(notificationId);
    if (!notif) continue;
    notif.isRead = true;
    await doc.save();
    return notif;
  }

  throw new Error('Notification not found');
};

module.exports = {
  addNotificationToUser,
  markNotificationRead,
};
