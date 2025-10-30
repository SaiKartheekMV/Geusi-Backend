const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    req.user = user;
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

module.exports = authMiddleware;
