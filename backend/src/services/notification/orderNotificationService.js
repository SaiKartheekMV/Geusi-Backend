const { addNotificationToUser } = require('../notificationService');

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

module.exports = {
  sendOrderStatusNotification,
};
