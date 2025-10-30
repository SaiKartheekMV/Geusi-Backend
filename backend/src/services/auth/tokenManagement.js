const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("./tokenService");

const refreshToken = async (req, res, Model) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await Model.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    
    if (user.accountStatus !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }
    
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = newRefreshToken;
    await user.save();
    
    res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    res.status(500).json({ message: "Token refresh failed", error: error.message });
  }
};

module.exports = {
  refreshToken,
};
