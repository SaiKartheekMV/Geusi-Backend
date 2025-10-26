const Admin = require("../models/Admin");
const authService = require("../services/authService");
const adminDashboardService = require("../services/admin/adminDashboardService");

const register = async (req, res) => {
  return authService.register(req, res, Admin, "admin");
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    if (admin.accountStatus !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }
    
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
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
    
    res.status(200).json({
      message: "Login successful",
      admin: adminResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const logout = async (req, res) => {
  return authService.logout(req, res, Admin);
};

const me = async (req, res) => {
  try {
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
    
    res.status(200).json({ admin: adminResponse });
  } catch (error) {
    console.error("Get admin error:", error);
    res.status(500).json({ 
      message: "Failed to get admin data", 
      error: error.message 
    });
  }
};

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

const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminDashboardService.getDashboardStats();
    res.status(200).json({ stats });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ 
      message: "Failed to get dashboard stats", 
      error: error.message 
    });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await adminDashboardService.getPendingRequests(page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ 
      message: "Failed to get pending requests", 
      error: error.message 
    });
  }
};

const getProcessedRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        message: "Status must be 'approved' or 'rejected'" 
      });
    }

    const result = await adminDashboardService.getProcessedRequests(status, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Get processed requests error:", error);
    res.status(500).json({ 
      message: "Failed to get processed requests", 
      error: error.message 
    });
  }
};

const getChefStatus = async (req, res) => {
  try {
    const status = await adminDashboardService.getChefStatusSummary();
    res.status(200).json({ status });
  } catch (error) {
    console.error("Get chef status error:", error);
    res.status(500).json({ 
      message: "Failed to get chef status", 
      error: error.message 
    });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await adminDashboardService.approveRequest(id);
    res.status(200).json({ 
      message: "Request approved successfully", 
      order 
    });
  } catch (error) {
    console.error("Approve request error:", error);
    
    // Handle specific error cases with appropriate status codes
    if (error.message.includes("not found")) {
      return res.status(404).json({ 
        message: error.message 
      });
    }
    
    if (error.message.includes("already approved")) {
      return res.status(400).json({ 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to approve request", 
      error: error.message 
    });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const order = await adminDashboardService.rejectRequest(id, rejectionReason);
    res.status(200).json({ 
      message: "Request rejected successfully", 
      order 
    });
  } catch (error) {
    console.error("Reject request error:", error);
    
    // Handle specific error cases
    if (error.message.includes("not found")) {
      return res.status(404).json({ 
        message: error.message 
      });
    }
    
    if (error.message.includes("Cannot reject")) {
      return res.status(400).json({ 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to reject request", 
      error: error.message 
    });
  }
};

const assignChef = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { chefId } = req.body;

    if (!chefId) {
      return res.status(400).json({ message: "Chef ID is required" });
    }

    const order = await adminDashboardService.assignChef(orderId, chefId);
    res.status(200).json({ 
      message: "Chef assigned successfully", 
      order 
    });
  } catch (error) {
    console.error("Assign chef error:", error);
    
    // Handle specific error cases
    if (error.message.includes("not found")) {
      return res.status(404).json({ 
        message: error.message 
      });
    }
    
    if (error.message.includes("not available") || 
        error.message.includes("not active") || 
        error.message.includes("must be approved")) {
      return res.status(400).json({ 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to assign chef", 
      error: error.message 
    });
  }
};

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