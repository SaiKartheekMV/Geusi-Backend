const Assignment = require("../../models/Assignment");
const { createAssignmentService, updateAssignmentService, deleteAssignmentService } = require("../../services/assignment/assignmentOperationsService");

const createAssignment = async (req, res) => {
  try {
    const assignmentData = req.body;
    const assignedBy = req.user._id;
    const io = req.app.get("io");

    const result = await createAssignmentService(assignmentData, assignedBy, io);

    if (!result.success) {
      return res.status(400).json({
        message: result.message,
        errors: result.errors,
      });
    }

    res.status(201).json({
      message: result.message,
      assignment: result.assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({
      message: "Failed to create assignment",
      error: error.message,
    });
  }
};

const getAssignments = async (req, res) => {
  try {
    const { userId, chefId, status, assignmentType, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

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
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments(query);

    res.status(200).json({
      assignments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({
      message: "Failed to get assignments",
      error: error.message,
    });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate("user", "firstName lastName email phone preferences")
      .populate("chef", "firstName lastName email phone cuisineSpecialty rating")
      .populate("assignedBy", "firstName lastName email");

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    res.status(200).json({ assignment });
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({
      message: "Failed to get assignment",
      error: error.message,
    });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await updateAssignmentService(id, updates);

    if (!result.success) {
      return res.status(400).json({
        message: result.message,
        errors: result.errors,
      });
    }

    res.status(200).json({
      message: result.message,
      assignment: result.assignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({
      message: "Failed to update assignment",
      error: error.message,
    });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAssignmentService(id);

    if (!result.success) {
      return res.status(400).json({
        message: result.message,
        errors: result.errors,
      });
    }

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({
      message: "Failed to delete assignment",
      error: error.message,
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
