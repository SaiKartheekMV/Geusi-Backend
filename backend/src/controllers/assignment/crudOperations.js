const Assignment = require("../../models/Assignment");
const { createAssignmentService, updateAssignmentService, deleteAssignmentService } = require("../../services/assignment/assignmentOperationsService");
const { sendResponse, sendErrorResponse, asyncHandler, calculatePagination } = require("../../utils/controllerUtils");

const createAssignment = asyncHandler(async (req, res) => {
  const assignmentData = req.body;
  const assignedBy = req.user._id;
  const io = req.app.get("io");

  const result = await createAssignmentService(assignmentData, assignedBy, io);

  if (!result.success) {
    return sendErrorResponse(res, 400, result.message, result.errors);
  }

  return sendResponse(res, 201, { assignment: result.data }, result.message);
});

const getAssignments = asyncHandler(async (req, res) => {
  const { userId, chefId, status, assignmentType, page = 1, limit = 10 } = req.query;

  let query = {};

  if (userId) query.user = userId;
  if (chefId) query.chef = chefId;
  if (status) query.status = status;
  if (assignmentType) query.assignmentType = assignmentType;

  const assignments = await Assignment.find(query)
    .populate("user", "firstName lastName email phone")
    .populate("chef", "firstName lastName email phone cuisineSpecialty")
    .populate("assignedBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Assignment.countDocuments(query);
  const { pagination } = calculatePagination(page, limit, total);

  return sendResponse(res, 200, {
    assignments,
    pagination,
  }, "Assignments retrieved successfully");
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id)
    .populate("user", "firstName lastName email phone preferences")
    .populate("chef", "firstName lastName email phone cuisineSpecialty rating")
    .populate("assignedBy", "firstName lastName email");

  if (!assignment) {
    return sendErrorResponse(res, 404, "Assignment not found");
  }

  return sendResponse(res, 200, { assignment }, "Assignment retrieved successfully");
});

const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const result = await updateAssignmentService(id, updates);

  if (!result.success) {
    return sendErrorResponse(res, 400, result.message, result.errors);
  }

  return sendResponse(res, 200, { assignment: result.data }, result.message);
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await deleteAssignmentService(id);

  if (!result.success) {
    return sendErrorResponse(res, 400, result.message, result.errors);
  }

  return sendResponse(res, 200, null, result.message);
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
