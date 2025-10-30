const nodemailer = require("nodemailer");
const User = require("../models/user");
const Admin = require("../models/Admin");
const Chef = require("../models/Chef");
const { logger } = require("./loggerService");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const createServiceResponse = (success, data = null, message = "", error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (success && data !== null) {
    response.data = data;
  }

  if (!success && error) {
    response.error = error.message || error;
    if (process.env.NODE_ENV === "development" && error.stack) {
      response.stack = error.stack;
    }
  }

  return response;
};

const findUserById = async (userId) => {
  const models = [
    { name: 'User', model: User },
    { name: 'Admin', model: Admin },
    { name: 'Chef', model: Chef },
  ];

  for (const { name, model } of models) {
    try {
      const doc = await model.findById(userId);
      if (doc) {
        return { user: doc, userType: name };
      }
    } catch (error) {
      logger.error(`Error finding user in ${name} model:`, error);
    }
  }

  return null;
};

const addNotificationToUser = async (userId, { message, type = "info", meta = {}, sendEmail = false }) => {
  try {
    if (!userId || !message) {
      return createServiceResponse(false, null, "User ID and message are required", new Error("Invalid parameters"));
    }

    const userResult = await findUserById(userId);
    if (!userResult) {
      return createServiceResponse(false, null, "User not found", new Error("User not found"));
    }

    const { user, userType } = userResult;

    const notification = {
      message,
      type,
      isRead: false,
      createdAt: new Date(),
      meta,
    };

    user.notifications = user.notifications || [];
    user.notifications.unshift(notification);
    
    await user.save();

    if (sendEmail && user.email) {
      try {
        const mailOptions = {
          from: `"Your App Name" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `New notification: ${type}`,
          text: message,
          html: `<p>${message}</p>`,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Notification email sent to ${user.email}`);
      } catch (emailError) {
        logger.error("Failed to send notification email:", emailError);
      }
    }

    return createServiceResponse(true, notification, "Notification added successfully");
  } catch (error) {
    logger.error("Error adding notification:", error);
    return createServiceResponse(false, null, "Failed to add notification", error);
  }
};

const markNotificationRead = async (userId, notificationId) => {
  try {
    if (!userId || !notificationId) {
      return createServiceResponse(false, null, "User ID and notification ID are required", new Error("Invalid parameters"));
    }

    const models = [User, Admin, Chef];

    for (const model of models) {
      try {
        const doc = await model.findById(userId);
        if (!doc) continue;

        const notification = doc.notifications.id(notificationId);
        if (!notification) continue;

        notification.isRead = true;
        await doc.save();

        return createServiceResponse(true, notification, "Notification marked as read");
      } catch (error) {
        logger.error(`Error marking notification read in ${model.modelName}:`, error);
        continue;
      }
    }

    return createServiceResponse(false, null, "Notification not found", new Error("Notification not found"));
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    return createServiceResponse(false, null, "Failed to mark notification as read", error);
  }
};

module.exports = {
  addNotificationToUser,
  markNotificationRead,
};