const { addNotificationToUser } = require('./notificationService');

const sendOrderStatusNotification = async (userId, chefId, order, io) => {
  const statusMessages = {
    new: 'Your order has been placed successfully and is awaiting chef assignment.',
    confirmed: 'Your order has been confirmed by the chef.',
    preparing: 'Your chef has started preparing your meal.',
    ready: 'Your meal is ready and out for delivery.',
    delivered: 'Your meal has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
    rejected: 'Your order has been rejected by the chef.'
  };

  const chefStatusMessages = {
    new: `New order received for ${order.foodName}.`,
    confirmed: `You've confirmed the order for ${order.foodName}.`,
    preparing: `You've started preparing the order for ${order.foodName}.`,
    ready: `The order for ${order.foodName} is ready for delivery.`,
    delivered: `The order for ${order.foodName} has been delivered.`,
    cancelled: `The order for ${order.foodName} has been cancelled.`,
    rejected: `You've rejected the order for ${order.foodName}.`
  };

  // Send notification to user
  if (userId) {
    const userNotification = await addNotificationToUser(userId, {
      message: statusMessages[order.status] || `Your order status has been updated to: ${order.status}`,
      type: 'order_update',
      meta: {
        orderId: order._id,
        status: order.status,
        foodName: order.foodName
      },
      sendEmail: ['confirmed', 'ready', 'delivered', 'cancelled', 'rejected'].includes(order.status)
    });

    // Send real-time notification if Socket.IO is available
    if (io) {
      io.to(`user_${userId}`).emit('notification', { 
        userId, 
        notification: userNotification,
        orderUpdate: {
          orderId: order._id,
          status: order.status
        }
      });
    }
  }

  // Send notification to chef if applicable
  if (chefId && order.status !== 'new') {
    const chefNotification = await addNotificationToUser(chefId, {
      message: chefStatusMessages[order.status] || `Order status updated to: ${order.status}`,
      type: 'chef_order_update',
      meta: {
        orderId: order._id,
        status: order.status,
        foodName: order.foodName,
        userId: userId
      },
      sendEmail: ['cancelled'].includes(order.status)
    });

    // Send real-time notification to chef
    if (io) {
      io.to(`user_${chefId}`).emit('notification', { 
        userId: chefId, 
        notification: chefNotification,
        orderUpdate: {
          orderId: order._id,
          status: order.status
        }
      });
    }
  }
};

const sendAssignmentNotification = async (userId, chefId, assignment, io) => {
  // Notify user about new chef assignment
  if (userId) {
    const userNotification = await addNotificationToUser(userId, {
      message: `You've been assigned to a new chef for your ${assignment.assignmentType} orders.`,
      type: 'assignment_update',
      meta: {
        assignmentId: assignment._id,
        assignmentType: assignment.assignmentType,
        chefId: chefId
      },
      sendEmail: true
    });

    if (io) {
      io.to(`user_${userId}`).emit('notification', { 
        userId, 
        notification: userNotification 
      });
    }
  }

  // Notify chef about new user assignment
  if (chefId) {
    const chefNotification = await addNotificationToUser(chefId, {
      message: `You've been assigned a new user for ${assignment.assignmentType} orders.`,
      type: 'chef_assignment_update',
      meta: {
        assignmentId: assignment._id,
        assignmentType: assignment.assignmentType,
        userId: userId
      },
      sendEmail: true
    });

    if (io) {
      io.to(`user_${chefId}`).emit('notification', { 
        userId: chefId, 
        notification: chefNotification 
      });
    }
  }
};

module.exports = {
  sendOrderStatusNotification,
  sendAssignmentNotification
};