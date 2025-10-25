const { bulkCreateAssignmentsService } = require("../../services/assignment/assignmentOperationsService");
const Assignment = require("../../models/Assignment");
const User = require("../../models/User");
const Chef = require("../../models/Chef");
const { getAssignmentRecommendations } = require("../../services/assignmentValidationService");

const bulkAssignChefs = async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        message: "Assignments array is required",
      });
    }

    const result = await bulkCreateAssignmentsService(assignments, req.user._id);

    res.status(200).json(result);
  } catch (error) {
    console.error("Bulk assign chefs error:", error);
    res.status(500).json({
      message: "Failed to perform bulk assignment",
      error: error.message,
    });
  }
};

const suspendAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    if (assignment.status === "suspended") {
      return res.status(400).json({
        message: "Assignment is already suspended",
      });
    }

    assignment.status = "suspended";
    assignment.notes = assignment.notes ? 
      `${assignment.notes}\nSuspended: ${reason || "No reason provided"}` : 
      `Suspended: ${reason || "No reason provided"}`;
    
    await assignment.save();

    res.status(200).json({
      message: "Assignment suspended successfully",
      assignment,
    });
  } catch (error) {
    console.error("Suspend assignment error:", error);
    res.status(500).json({
      message: "Failed to suspend assignment",
      error: error.message,
    });
  }
};

const reactivateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    if (assignment.status !== "suspended") {
      return res.status(400).json({
        message: "Assignment is not suspended",
      });
    }

    const user = await User.findById(assignment.user);
    const chef = await Chef.findById(assignment.chef);

    if (!user || !chef || user.accountStatus !== "active" || chef.accountStatus !== "active") {
      return res.status(400).json({
        message: "User or Chef account is not active",
      });
    }

    assignment.status = "active";
    await assignment.save();

    res.status(200).json({
      message: "Assignment reactivated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Reactivate assignment error:", error);
    res.status(500).json({
      message: "Failed to reactivate assignment",
      error: error.message,
    });
  }
};

const getChefRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await getAssignmentRecommendations(userId);

    if (result.error) {
      return res.status(400).json({
        message: result.error,
      });
    }

    res.status(200).json({
      recommendations: result.recommendations,
    });
  } catch (error) {
    console.error("Get chef recommendations error:", error);
    res.status(500).json({
      message: "Failed to get chef recommendations",
      error: error.message,
    });
  }
};

module.exports = {
  bulkAssignChefs,
  suspendAssignment,
  reactivateAssignment,
  getChefRecommendations,
};
