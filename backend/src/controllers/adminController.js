const Admin = require("../models/Admin");
const authService = require("../services/authService");
const adminDashboardService = require("../services/admin/adminDashboardService");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../utils/controllerUtils");

const register = async (req, res) => {
  return authService.register(req, res, Admin, "admin");
};

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendErrorResponse(res, 400, "Email and password are required");
    }
    
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return sendErrorResponse(res, 401, "Invalid email or password");
    }
    
    if (admin.accountStatus !== "active") {
      return sendErrorResponse(res, 403, "Account is not active");
    }
    
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return sendErrorResponse(res, 401, "Invalid email or password");
    }
    
    const accessToken = authService.generateAccessToken(admin._id);
    const refreshToken = authService.generateRefreshToken(admin._id);
    
    admin.refreshToken = refreshToken;
    await admin.updateLastLogin();
    
    const adminResponse = {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      permissions: admin.permissions,
      accountStatus: admin.accountStatus,
      profileImage: admin.profileImage,
      lastLogin: admin.lastLogin,
    };
    
    return sendResponse(res, 200, { admin: adminResponse, accessToken, refreshToken }, "Login successful");
});

const logout = async (req, res) => {
  return authService.logout(req, res, Admin);
};

const me = asyncHandler(async (req, res) => {
    const adminResponse = {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      permissions: req.user.permissions,
      accountStatus: req.user.accountStatus,
      profileImage: req.user.profileImage,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };
    
    return sendResponse(res, 200, { admin: adminResponse }, "Admin profile retrieved successfully");
});

const refreshToken = async (req, res) => {
  return authService.refreshToken(req, res, Admin);
};

const changePassword = async (req, res) => {
  return authService.changePassword(req, res, Admin);
};

const forgotPassword = async (req, res) => {
  return authService.forgotPassword(req, res, Admin);
};

const resetPassword = async (req, res) => {
  return authService.resetPassword(req, res, Admin);
};

const getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await adminDashboardService.getDashboardStats();
    return sendResponse(res, 200, { stats }, "Dashboard stats retrieved successfully");
});

const getPendingRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await adminDashboardService.getPendingRequests(page, limit);
    return sendResponse(res, 200, result, "Pending requests retrieved successfully");
});

const getProcessedRequests = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    if (!status || !["approved", "rejected"].includes(status)) {
      return sendErrorResponse(res, 400, "Status must be 'approved' or 'rejected'");
    }

    const result = await adminDashboardService.getProcessedRequests(status, page, limit);
    return sendResponse(res, 200, result, "Processed requests retrieved successfully");
});

const getChefStatus = asyncHandler(async (req, res) => {
    const status = await adminDashboardService.getChefStatusSummary();
    return sendResponse(res, 200, { status }, "Chef status retrieved successfully");
});

const approveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await adminDashboardService.approveRequest(id);
    return sendResponse(res, 200, { order }, "Request approved successfully");
});

const rejectRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const order = await adminDashboardService.rejectRequest(id, rejectionReason);
    return sendResponse(res, 200, { order }, "Request rejected successfully");
});

const assignChef = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { chefId } = req.body;

    if (!chefId) {
      return sendErrorResponse(res, 400, "Chef ID is required");
    }

    const order = await adminDashboardService.assignChef(orderId, chefId);
    return sendResponse(res, 200, { order }, "Chef assigned successfully");
});

module.exports = {
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getDashboardStats,
  getPendingRequests,
  getProcessedRequests,
  getChefStatus,
  approveRequest,
  rejectRequest,
  assignChef,
};