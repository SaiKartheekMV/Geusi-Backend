const Assignment = require("../../models/Assignment");
const Order = require("../../models/order");

const validateAssignmentUpdate = async (assignmentId, updateData) => {
  const errors = [];
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    errors.push("Assignment not found");
    return { isValid: false, errors };
  }

  if (updateData.status) {
    const validTransitions = {
      active: ["inactive", "suspended", "completed"],
      inactive: ["active"],
      suspended: ["active", "completed"],
      completed: [],
    };

    if (!validTransitions[assignment.status]?.includes(updateData.status)) {
      errors.push(`Invalid status transition from ${assignment.status} to ${updateData.status}`);
    }

    if (updateData.status === "completed") {
      const activeOrders = await Order.countDocuments({
        assignment: assignmentId,
        status: { $in: ["new", "confirmed", "preparing", "onTheWay"] },
      });

      if (activeOrders > 0) {
        errors.push("Cannot complete assignment with active orders");
      }
    }
  }

  if (updateData.endDate && new Date(updateData.endDate) <= new Date()) {
    errors.push("End date must be in the future");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateAssignmentDeletion = async (assignmentId) => {
  const errors = [];
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    errors.push("Assignment not found");
    return { isValid: false, errors };
  }

  const activeOrders = await Order.countDocuments({
    assignment: assignmentId,
    status: { $in: ["new", "confirmed", "preparing", "on_the_way"] },
  });

  if (activeOrders > 0) {
    errors.push("Cannot delete assignment with active orders");
  }

  const completedOrders = await Order.countDocuments({
    assignment: assignmentId,
    status: "delivered",
  });

  if (completedOrders > 0 && assignment.status !== "completed") {
    errors.push("Assignment has completed orders and should be marked as completed before deletion");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateAssignmentUpdate,
  validateAssignmentDeletion,
};
