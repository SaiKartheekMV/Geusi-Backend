const { addNotificationToUser } = require('../notificationService');

const sendAssignmentNotification = async (userId, chefId, assignment, io) => {
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
  sendAssignmentNotification,
};
