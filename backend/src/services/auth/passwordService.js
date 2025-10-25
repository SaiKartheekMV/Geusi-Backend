const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../emailService");

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
  changePassword,
  forgotPassword,
  resetPassword,
};
