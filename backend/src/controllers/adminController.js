const Admin = require("../models/Admin");
const authService = require("../services/authService");

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

module.exports = {
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
