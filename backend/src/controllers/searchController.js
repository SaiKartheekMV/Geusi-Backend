const searchService = require("../services/search/searchService");

// Search orders with advanced filters
const searchOrders = async (req, res) => {
  try {
    const filters = {
      search: req.query.search || req.query.q || "",
      status: req.query.status || "",
      requestType: req.query.requestType || req.query.type || "",
      startDate: req.query.startDate || "",
      endDate: req.query.endDate || "",
      location: req.query.location || "",
      assignedChef: req.query.assignedChef || "",
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await searchService.searchOrders(filters);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Search orders error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await searchService.getOrderDetails(id);
    
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get order details",
      error: error.message,
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const filters = {
      search: req.query.search || req.query.q || "",
      accountStatus: req.query.accountStatus || "",
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await searchService.searchUsers(filters);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "User search failed",
      error: error.message,
    });
  }
};

// Search chefs
const searchChefs = async (req, res) => {
  try {
    const filters = {
      search: req.query.search || req.query.q || "",
      accountStatus: req.query.accountStatus || "",
      isAvailable: req.query.isAvailable || "",
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await searchService.searchChefs(filters);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Search chefs error:", error);
    res.status(500).json({
      success: false,
      message: "Chef search failed",
      error: error.message,
    });
  }
};

// Global search
const globalSearch = async (req, res) => {
  try {
    const { q, page = 1, limit = 5 } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search term is required",
      });
    }

    const result = await searchService.globalSearch(q, page, limit);
    
    res.status(200).json({
      success: true,
      searchTerm: q,
      ...result,
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({
      success: false,
      message: "Global search failed",
      error: error.message,
    });
  }
};

module.exports = {
  searchOrders,
  getOrderDetails,
  searchUsers,
  searchChefs,
  globalSearch,
};