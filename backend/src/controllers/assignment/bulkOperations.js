const { bulkCreateAssignmentsService } = require("../../services/assignment/assignmentOperationsService");
const Assignment = require("../../models/Assignment");
const User = require("../../models/user");
const Chef = require("../../models/Chef");
const { getAssignmentRecommendations } = require("../../services/assignmentValidationService");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../../utils/controllerUtils");

const bulkAssignChefs = asyncHandler(async (req, res) => {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return sendErrorResponse(res, 400, "Assignments array is required");
    }

    const result = await bulkCreateAssignmentsService(assignments, req.user._id);
    return sendResponse(res, 200, result, "Bulk assignment completed");
});

const suspendAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return sendErrorResponse(res, 404, "Assignment not found");
    }

    if (assignment.status === "suspended") {
      return sendErrorResponse(res, 400, "Assignment is already suspended");
    }

    assignment.status = "suspended";
    assignment.notes = assignment.notes ? 
      `${assignment.notes}\nSuspended: ${reason || "No reason provided"}` : 
      `Suspended: ${reason || "No reason provided"}`;
    
    await assignment.save();

    return sendResponse(res, 200, { assignment }, "Assignment suspended successfully");
});

const reactivateAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return sendErrorResponse(res, 404, "Assignment not found");
    }

    if (assignment.status !== "suspended") {
      return sendErrorResponse(res, 400, "Assignment is not suspended");
    }

    const user = await User.findById(assignment.user);
    const chef = await Chef.findById(assignment.chef);

    if (!user || !chef || user.accountStatus !== "active" || chef.accountStatus !== "active") {
      return sendErrorResponse(res, 400, "User or Chef account is not active");
    }

    assignment.status = "active";
    await assignment.save();

    return sendResponse(res, 200, { assignment }, "Assignment reactivated successfully");
});

const getChefRecommendations = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const result = await getAssignmentRecommendations(userId);

    if (result.error) {
      return sendErrorResponse(res, 400, result.error);
    }

    return sendResponse(res, 200, { recommendations: result.recommendations }, "Chef recommendations retrieved successfully");
});

module.exports = {
  bulkAssignChefs,
  suspendAssignment,
  reactivateAssignment,
  getChefRecommendations,
};
