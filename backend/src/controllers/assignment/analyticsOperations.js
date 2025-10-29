const Assignment = require("../../models/Assignment");
const User = require("../../models/user");
const Chef = require("../../models/Chef");
const { asyncHandler, sendResponse, sendErrorResponse, calculatePagination } = require("../../utils/controllerUtils");

const getAssignmentStats = asyncHandler(async (req, res) => {
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

    return sendResponse(res, 200, {
      stats,
      summary: {
        totalAssignments,
        activeAssignments,
        inactiveAssignments: totalAssignments - activeAssignments,
      },
    }, "Assignment statistics retrieved successfully");
});

const getAvailableChefs = asyncHandler(async (req, res) => {
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

    return sendResponse(res, 200, { chefs: availableChefs, total: availableChefs.length }, "Available chefs retrieved successfully");
});

const getUsersWithoutChef = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

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

    const totalCount = total[0]?.total || 0;
    const { pagination } = calculatePagination(page, limit, totalCount);

    return sendResponse(res, 200, { users: usersWithoutChef, pagination }, "Users without chef retrieved successfully");
});

module.exports = {
  getAssignmentStats,
  getAvailableChefs,
  getUsersWithoutChef,
};


