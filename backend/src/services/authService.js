const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("./emailService");

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "1h",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
};

const validateRegistrationData = (data) => {
  const { firstName, lastName, email, phone, password } = data;
  
  if (!firstName || !lastName || !email || !phone || !password) {
    return { isValid: false, error: "All fields are required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  
  return { isValid: true };
};

const checkExistingUser = async (Model, email, phone) => {
  const existingUser = await Model.findOne({
    $or: [{ email }, { phone }],
  });
  
  if (existingUser) {
    if (existingUser.email === email) {
      return { exists: true, error: "Email already registered" };
    }
    if (existingUser.phone === phone) {
      return { exists: true, error: "Phone number already registered" };
    }
  }
  
  return { exists: false };
};

const createUserResponse = (user, userType = "user") => {
  const baseResponse = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    accountStatus: user.accountStatus,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
  };
  
  if (userType === "chef") {
    return {
      ...baseResponse,
      cuisineSpecialty: user.cuisineSpecialty,
      rating: user.rating,
      isAvailable: user.isAvailable,
    };
  }
  
  return {
    ...baseResponse,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    householdSize: user.householdSize,
    preferences: user.preferences,
    subscription: user.subscription,
  };
};

const register = async (req, res, Model, userType = "user") => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    const validation = validateRegistrationData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }
    
    const existingCheck = await checkExistingUser(Model, email, phone);
    if (existingCheck.exists) {
      return res.status(400).json({ message: existingCheck.error });
    }
    
    const user = new Model({
      firstName,
      lastName,
      email,
      phone,
      password,
    });
    
    await user.save();
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    const userResponse = createUserResponse(user, userType);
    
    res.status(201).json({
      message: `${userType === "chef" ? "Cook" : "User"} registered successfully`,
      [userType === "chef" ? "cook" : "user"]: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(`${userType} registration error:`, error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const login = async (req, res, Model, userType = "user") => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const user = await Model.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    if (user.accountStatus !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    const userResponse = createUserResponse(user, userType);
    
    res.status(200).json({
      message: "Login successful",
      [userType === "chef" ? "cook" : "user"]: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(`${userType} login error:`, error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const logout = async (req, res, Model) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await Model.findById(decoded.userId);
    
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(200).json({ message: "Logout successful" });
  }
};

const me = async (req, res, userType = "user") => {
  try {
    const userResponse = createUserResponse(req.user, userType);
    
    res.status(200).json({ 
      [userType === "chef" ? "cook" : "user"]: userResponse 
    });
  } catch (error) {
    console.error(`Get ${userType} error:`, error);
    res.status(500).json({ 
      message: `Failed to get ${userType} data`, 
      error: error.message 
    });
  }
};

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

const changePassword = async (req, res, Model) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    
    const user = await Model.findById(req.user._id);
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    user.password = newPassword;
    user.refreshToken = null;
    await user.save();
    
    res.status(200).json({ message: "Password changed successfully. Please login again." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Password change failed", error: error.message });
  }
};

const forgotPassword = async (req, res, Model) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const user = await Model.findOne({ email });
    
    if (!user) {
      return res.status(200).json({ message: "If the email exists, a reset link has been sent" });
    }
    
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    
    const userName = `${user.firstName} ${user.lastName}`;
    const emailResult = await sendPasswordResetEmail(email, resetToken, userName);
    
    if (!emailResult.success) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({ message: "Failed to send reset email. Please try again later." });
    }
    
    res.status(200).json({
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process request", error: error.message });
  }
};

const resetPassword = async (req, res, Model) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    const user = await Model.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null;
    await user.save();
    
    res.status(200).json({ message: "Password reset successful. Please login with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
