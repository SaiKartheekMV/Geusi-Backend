const Order = require("../../models/Order");
const User = require("../../models/User");
const Chef = require("../../models/Chef");

/**
 * Advanced search for orders with multiple filters
 * Supports: search text, status, date range, request type, pagination
 */
const searchOrders = async (filters = {}) => {
  try {
    const {
      search = "",
      status = "",
      requestType = "",
      startDate = "",
      endDate = "",
      location = "",
      assignedChef = "",
      page = 1,
      limit = 10,
    } = filters;

    let query = {};

    // Text search: Request ID, Food Name, Description
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      
      let orderIdMatch = null;
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        orderIdMatch = search;
      }

      query.$or = [
        { _id: orderIdMatch },
        { foodName: searchRegex },
        { description: searchRegex },
      ];
    }

    // Status filter with custom mapping
    if (status && status !== "" && status !== "all") {
      if (status === "pending") {
        query.status = "new";
        query.adminApproved = false;
      } else if (status === "completed") {
        query.status = "delivered";
      } else if (status === "in_progress") {
        query.status = { $in: ["confirmed", "preparing", "on_the_way"] };
      } else {
        query.status = status;
      }
    }

    // Request type: chef hiring vs custom order
    if (requestType && requestType !== "" && requestType !== "all") {
      if (requestType === "chef_hiring") {
        query.scheduledDate = { $exists: true, $ne: null };
      } else if (requestType === "custom_order") {
        query.scheduledDate = null;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Location filter
    if (location && location.trim() !== "") {
      const locationRegex = new RegExp(location.trim(), "i");
      query.$or = query.$or || [];
      query.$or.push(
        { "deliveryAddress.city": locationRegex },
        { "deliveryAddress.state": locationRegex },
        { "deliveryAddress.pincode": locationRegex }
      );
    }

    // Assigned chef filter
    if (assignedChef && assignedChef.trim() !== "") {
      query.chef = assignedChef;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate({
        path: "user",
        select: "firstName lastName email phone",
      })
      .populate({
        path: "chef",
        select: "firstName lastName phone profileImage",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Post-query filter for customer name search
    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase();
      const filteredOrders = orders.filter((order) => {
        if (!order.user) return false;
        
        const fullName = `${order.user.firstName} ${order.user.lastName}`.toLowerCase();
        return fullName.includes(searchLower);
      });

      if (filteredOrders.length > 0 && filteredOrders.length < orders.length) {
        const total = filteredOrders.length;
        return {
          orders: filteredOrders,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
          },
          filters: {
            search,
            status,
            requestType,
            startDate,
            endDate,
            location,
          },
        };
      }
    }

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
        status,
        requestType,
        startDate,
        endDate,
        location,
      },
    };
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
};

/**
 * Get order details with full populated information
 */
const getOrderDetails = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        select: "firstName lastName email phone profileImage householdSize preferences",
      })
      .populate({
        path: "chef",
        select: "firstName lastName email phone profileImage cuisineSpecialty rating isAvailable",
      });

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  } catch (error) {
    throw new Error(`Failed to get order details: ${error.message}`);
  }
};

/**
 * Search users for admin management
 */
const searchUsers = async (filters = {}) => {
  try {
    const {
      search = "",
      accountStatus = "",
      page = 1,
      limit = 10,
    } = filters;

    let query = {};

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (accountStatus && accountStatus !== "" && accountStatus !== "all") {
      query.accountStatus = accountStatus;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password -refreshToken -resetPasswordToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`User search failed: ${error.message}`);
  }
};

/**
 * Search chefs for admin management
 */
const searchChefs = async (filters = {}) => {
  try {
    const {
      search = "",
      accountStatus = "",
      isAvailable = "",
      page = 1,
      limit = 10,
    } = filters;

    let query = {};

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (accountStatus && accountStatus !== "" && accountStatus !== "all") {
      query.accountStatus = accountStatus;
    }

    if (isAvailable !== "" && isAvailable !== "all") {
      query.isAvailable = isAvailable === "true";
    }

    const skip = (page - 1) * limit;

    const chefs = await Chef.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chef.countDocuments(query);

    return {
      chefs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Chef search failed: ${error.message}`);
  }
};

/**
 * Global search across orders, users, and chefs
 */
const globalSearch = async (searchTerm, page = 1, limit = 5) => {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return {
        orders: [],
        users: [],
        chefs: [],
        message: "Please provide a search term",
      };
    }

    const searchRegex = new RegExp(searchTerm.trim(), "i");

    const orders = await Order.find({
      $or: [
        { foodName: searchRegex },
        { description: searchRegex },
      ],
    })
      .populate("user", "firstName lastName")
      .populate("chef", "firstName lastName")
      .limit(parseInt(limit))
      .lean();

    const users = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("firstName lastName email phone profileImage")
      .limit(parseInt(limit))
      .lean();

    const chefs = await Chef.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("firstName lastName email phone profileImage cuisineSpecialty")
      .limit(parseInt(limit))
      .lean();

    return {
      orders: orders.map((o) => ({ ...o, type: "order" })),
      users: users.map((u) => ({ ...u, type: "user" })),
      chefs: chefs.map((c) => ({ ...c, type: "chef" })),
      totalResults: orders.length + users.length + chefs.length,
    };
  } catch (error) {
    throw new Error(`Global search failed: ${error.message}`);
  }
};

module.exports = {
  searchOrders,
  getOrderDetails,
  searchUsers,
  searchChefs,
  globalSearch,
};