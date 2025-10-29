const searchService = require("../services/search/searchService");
const { sendResponse, sendErrorResponse, asyncHandler } = require("../utils/controllerUtils");

const searchOrders = asyncHandler(async (req, res) => {
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
  
  return sendResponse(res, 200, result, "Orders retrieved successfully");
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await searchService.getOrderDetails(id);
  
  return sendResponse(res, 200, { order }, "Order details retrieved successfully");
});

const searchUsers = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search || req.query.q || "",
    accountStatus: req.query.accountStatus || "",
    page: req.query.page || 1,
    limit: req.query.limit || 10,
  };

  const result = await searchService.searchUsers(filters);
  
  return sendResponse(res, 200, result, "Users retrieved successfully");
});

const searchChefs = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search || req.query.q || "",
    accountStatus: req.query.accountStatus || "",
    isAvailable: req.query.isAvailable || "",
    page: req.query.page || 1,
    limit: req.query.limit || 10,
  };

  const result = await searchService.searchChefs(filters);
  
  return sendResponse(res, 200, result, "Chefs retrieved successfully");
});

const globalSearch = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 5 } = req.query;

  if (!q || q.trim() === "") {
    return sendErrorResponse(res, 400, "Search term is required");
  }

  const result = await searchService.globalSearch(q, page, limit);
  
  return sendResponse(res, 200, {
    searchTerm: q,
    ...result,
  }, "Global search completed successfully");
});

module.exports = {
  searchOrders,
  getOrderDetails,
  searchUsers,
  searchChefs,
  globalSearch,
};