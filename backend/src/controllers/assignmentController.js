const Assignment = require("../models/Assignment");
const User = require("../models/User");
const Chef = require("../models/Chef");
const { sendAssignmentNotification } = require("../services/orderNotificationService");
const Order = require("../models/Order");
const { 
  validateAssignmentConstraints, 
  validateAssignmentUpdate, 
  validateAssignmentDeletion,
  getAssignmentRecommendations 
} = require("../services/assignmentValidationService");

const createAssignment = async (req, res) => {
  try {
    const { userId, chefId, assignmentType, subscriptionDetails, notes } = req.body;

    const validation = await validateAssignmentConstraints({
      userId,
      chefId,
      assignmentType,
      subscriptionDetails,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Assignment validation failed",
        errors: validation.errors,
      });
    }

    const assignment = new Assignment({
      user: userId,
      chef: chefId,
      assignedBy: req.user._id,
      assignmentType,
      subscriptionDetails,
      notes,
    });

    await assignment.save();

    await User.findByIdAndUpdate(userId, {
      $push: { assignments: assignment._id },
    });

    await Chef.findByIdAndUpdate(chefId, {
      $push: { assignments: assignment._id },
    });

    // Send notifications to both user and chef about the new assignment
    const io = req.app.get("io");
    await sendAssignmentNotification(userId, chefId, assignment, io);

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("user", "firstName lastName email phone")
      .populate("chef", "firstName lastName email phone cuisineSpecialty")
      .populate("assignedBy", "firstName lastName email");

    res.status(201).json({
      message: "Assignment created successfully",
      assignment: populatedAssignment,
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

    const validation = await validateAssignmentUpdate(id, updates);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Assignment update validation failed",
        errors: validation.errors,
      });
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
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

    res.status(200).json({
      message: "Assignment updated successfully",
      assignment: populatedAssignment,
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

    const validation = await validateAssignmentDeletion(id);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Assignment deletion validation failed",
        errors: validation.errors,
      });
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    await User.findByIdAndUpdate(assignment.user, {
      $pull: { assignments: assignment._id },
    });

    await Chef.findByIdAndUpdate(assignment.chef, {
      $pull: { assignments: assignment._id },
    });

    await Assignment.findByIdAndDelete(id);

    res.status(200).json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({
      message: "Failed to delete assignment",
      error: error.message,
    });
  }
};

const getAssignmentStats = async (req, res) => {
  try {
    const { chefId, userId } = req.query;

    let matchQuery = {};
    if (chefId) matchQuery.chef = chefId;
    if (userId) matchQuery.user = userId;

    const stats = await Assignment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalOrders: { $sum: "$totalOrders" },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalAssignments = await Assignment.countDocuments(matchQuery);
    const activeAssignments = await Assignment.countDocuments({
      ...matchQuery,
      status: "active",
    });

    res.status(200).json({
      stats,
      summary: {
        totalAssignments,
        activeAssignments,
        inactiveAssignments: totalAssignments - activeAssignments,
      },
    });
  } catch (error) {
    console.error("Get assignment stats error:", error);
    res.status(500).json({
      message: "Failed to get assignment statistics",
      error: error.message,
    });
  }
};

const getAvailableChefs = async (req, res) => {
  try {
    const { cuisineSpecialty, location, excludeUserId } = req.query;

    let query = {
      accountStatus: "active",
      isAvailable: true,
    };

    if (cuisineSpecialty) {
      query.cuisineSpecialty = { $in: cuisineSpecialty.split(",") };
    }

    const chefs = await Chef.find(query)
      .select("firstName lastName email phone cuisineSpecialty rating isAvailable")
      .sort({ rating: -1 });

    const availableChefs = chefs.filter(chef => {
      if (excludeUserId) {
        return !chef.assignments.some(assignment => 
          assignment.user.toString() === excludeUserId && 
          assignment.status === "active"
        );
      }
      return true;
    });

    res.status(200).json({
      chefs: availableChefs,
      total: availableChefs.length,
    });
  } catch (error) {
    console.error("Get available chefs error:", error);
    res.status(500).json({
      message: "Failed to get available chefs",
      error: error.message,
    });
  }
};

const getUsersWithoutChef = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const usersWithoutChef = await User.aggregate([
      {
        $lookup: {
          from: "assignments",
          localField: "_id",
          foreignField: "user",
          as: "assignments",
        },
      },
      {
        $match: {
          accountStatus: "active",
          $or: [
            { assignments: { $size: 0 } },
            { "assignments.status": { $nin: ["active"] } },
          ],
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          preferences: 1,
          householdSize: 1,
        },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const total = await User.aggregate([
      {
        $lookup: {
          from: "assignments",
          localField: "_id",
          foreignField: "user",
          as: "assignments",
        },
      },
      {
        $match: {
          accountStatus: "active",
          $or: [
            { assignments: { $size: 0 } },
            { "assignments.status": { $nin: ["active"] } },
          ],
        },
      },
      { $count: "total" },
    ]);

    res.status(200).json({
      users: usersWithoutChef,
      pagination: {
        total: total[0]?.total || 0,
        page: parseInt(page),
        pages: Math.ceil((total[0]?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get users without chef error:", error);
    res.status(500).json({
      message: "Failed to get users without chef",
      error: error.message,
    });
  }
};

const bulkAssignChefs = async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        message: "Assignments array is required",
      });
    }

    const results = [];
    const errors = [];

    for (const assignmentData of assignments) {
      try {
        const { userId, chefId, assignmentType, subscriptionDetails, notes } = assignmentData;

        const existingAssignment = await Assignment.findOne({
          user: userId,
          chef: chefId,
          status: { $in: ["active", "suspended"] },
        });

        if (existingAssignment) {
          errors.push({
            userId,
            chefId,
            error: "Active assignment already exists",
          });
          continue;
        }

        const user = await User.findById(userId);
        const chef = await Chef.findById(chefId);

        if (!user || !chef) {
          errors.push({
            userId,
            chefId,
            error: "User or Chef not found",
          });
          continue;
        }

        if (user.accountStatus !== "active" || chef.accountStatus !== "active") {
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
          assignedBy: req.user._id,
          assignmentType,
          subscriptionDetails,
          notes,
        });

        await assignment.save();

        await User.findByIdAndUpdate(userId, {
          $push: { assignments: assignment._id },
        });

        await Chef.findByIdAndUpdate(chefId, {
          $push: { assignments: assignment._id },
        });

        results.push({
          userId,
          chefId,
          assignmentId: assignment._id,
          status: "success",
        });
      } catch (error) {
        errors.push({
          userId: assignmentData.userId,
          chefId: assignmentData.chefId,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Bulk assignment completed",
      results,
      errors,
      summary: {
        successful: results.length,
        failed: errors.length,
        total: assignments.length,
      },
    });
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
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
  getAvailableChefs,
  getUsersWithoutChef,
  bulkAssignChefs,
  suspendAssignment,
  reactivateAssignment,
  getChefRecommendations,
};
