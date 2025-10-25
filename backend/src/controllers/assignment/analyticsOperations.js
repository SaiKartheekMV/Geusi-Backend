const Assignment = require("../../models/Assignment");
const User = require("../../models/User");
const Chef = require("../../models/Chef");

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

module.exports = {
  getAssignmentStats,
  getAvailableChefs,
  getUsersWithoutChef,
};
