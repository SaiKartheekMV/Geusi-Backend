const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const admin = await Admin.findById(decoded.userId).select(
      "-password -refreshToken -resetPasswordToken -resetPasswordExpires"
    );

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (admin.accountStatus !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    req.user = admin;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid access token" });
    }
    return res.status(500).json({ message: "Authentication failed" });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}` 
      });
    }
    next();
  };
};

const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(" or ")}` 
      });
    }
    next();
  };
};

module.exports = {
  adminAuthMiddleware,
  requirePermission,
  requireRole,
};
