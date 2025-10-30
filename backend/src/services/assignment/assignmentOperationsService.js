const Assignment = require("../../models/Assignment");
const User = require("../../models/user");
const Chef = require("../../models/Chef");
const { sendAssignmentNotification } = require("../orderNotificationService");
const { 
  validateAssignmentConstraints, 
  validateAssignmentUpdate, 
  validateAssignmentDeletion
} = require("./assignmentValidationService");
const { createSuccessServiceResponse, createErrorServiceResponse, handleServiceError } = require("../../utils/serviceUtils");

const createAssignmentService = async (assignmentData, assignedBy, io) => {
  const mongoose = require("mongoose");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, chefId, assignmentType, subscriptionDetails, notes } = assignmentData;

    const validation = await validateAssignmentConstraints({
      userId,
      chefId,
      assignmentType,
      subscriptionDetails,
    });

    if (!validation.isValid) {
      await session.abortTransaction();
      await session.endSession();
      return createErrorServiceResponse("Assignment validation failed", validation.errors);
    }

    const assignment = new Assignment({
      user: userId,
      chef: chefId,
      assignedBy,
      assignmentType,
      subscriptionDetails,
      notes,
    });

    await assignment.save({ session });

    await User.findByIdAndUpdate(
      userId,
      { $push: { assignments: assignment._id } },
      { session }
    );

    await Chef.findByIdAndUpdate(
      chefId,
      { $push: { assignments: assignment._id } },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    await sendAssignmentNotification(userId, chefId, assignment, io);

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("user", "firstName lastName email phone")
      .populate("chef", "firstName lastName email phone cuisineSpecialty")
      .populate("assignedBy", "firstName lastName email");

    return createSuccessServiceResponse(populatedAssignment, "Assignment created successfully");
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return handleServiceError(error, "Create assignment");
  }
};

const bulkCreateAssignmentsService = async (assignmentsData, assignedBy) => {
  const mongoose = require("mongoose");
  try {
    const results = [];
    const errors = [];

    for (const assignmentData of assignmentsData) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const { userId, chefId, assignmentType, subscriptionDetails, notes } = assignmentData;

        const existingAssignment = await Assignment.findOne({
          user: userId,
          chef: chefId,
          status: { $in: ["active", "suspended"] },
        }).session(session);

        if (existingAssignment) {
          await session.abortTransaction();
          await session.endSession();
          errors.push({
            userId,
            chefId,
            error: "Active assignment already exists",
          });
          continue;
        }

        const user = await User.findById(userId).session(session);
        const chef = await Chef.findById(chefId).session(session);

        if (!user || !chef) {
          await session.abortTransaction();
          await session.endSession();
          errors.push({
            userId,
            chefId,
            error: "User or Chef not found",
          });
          continue;
        }

        if (user.accountStatus !== "active" || chef.accountStatus !== "active") {
          await session.abortTransaction();
          await session.endSession();
          errors.push({
            userId,
            chefId,
            error: "User or Chef account is not active",
          });
          continue;
        }

        const assignment = new Assignment({
          user: userId,
          chef: chefId,
          assignedBy,
          assignmentType,
          subscriptionDetails,
          notes,
        });

        await assignment.save({ session });

        await User.findByIdAndUpdate(
          userId,
          { $push: { assignments: assignment._id } },
          { session }
        );

        await Chef.findByIdAndUpdate(
          chefId,
          { $push: { assignments: assignment._id } },
          { session }
        );

        await session.commitTransaction();
        await session.endSession();

        results.push({
          userId,
          chefId,
          assignmentId: assignment._id,
          status: "success",
        });
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        errors.push({
          userId: assignmentData.userId,
          chefId: assignmentData.chefId,
          error: error.message,
        });
      }
    }

    return createSuccessServiceResponse({
      results,
      errors,
      summary: {
        successful: results.length,
        failed: errors.length,
        total: assignmentsData.length,
      },
    }, "Bulk assignment completed");
  } catch (error) {
    return handleServiceError(error, "Bulk create assignments");
  }
};

const updateAssignmentService = async (assignmentId, updates) => {
  try {
    const validation = await validateAssignmentUpdate(assignmentId, updates);

    if (!validation.isValid) {
      return createErrorServiceResponse("Assignment update validation failed", validation.errors);
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return createErrorServiceResponse("Assignment not found");
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        assignment[key] = updates[key];
      }
    });

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("user", "firstName lastName email phone")
      .populate("chef", "firstName lastName email phone cuisineSpecialty")
      .populate("assignedBy", "firstName lastName email");

    return createSuccessServiceResponse(populatedAssignment, "Assignment updated successfully");
  } catch (error) {
    return handleServiceError(error, "Update assignment");
  }
};

const deleteAssignmentService = async (assignmentId) => {
  const mongoose = require("mongoose");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validation = await validateAssignmentDeletion(assignmentId);

    if (!validation.isValid) {
      await session.abortTransaction();
      await session.endSession();
      return createErrorServiceResponse("Assignment deletion validation failed", validation.errors);
    }

    const assignment = await Assignment.findById(assignmentId).session(session);

    if (!assignment) {
      await session.abortTransaction();
      await session.endSession();
      return createErrorServiceResponse("Assignment not found");
    }

    await User.findByIdAndUpdate(
      assignment.user,
      { $pull: { assignments: assignment._id } },
      { session }
    );

    await Chef.findByIdAndUpdate(
      assignment.chef,
      { $pull: { assignments: assignment._id } },
      { session }
    );

    await Assignment.findByIdAndDelete(assignmentId).session(session);

    await session.commitTransaction();
    await session.endSession();

    return createSuccessServiceResponse(null, "Assignment deleted successfully");
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return handleServiceError(error, "Delete assignment");
  }
};

module.exports = {
  createAssignmentService,
  bulkCreateAssignmentsService,
  updateAssignmentService,
  deleteAssignmentService,
};
