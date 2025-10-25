const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../utils/controllerUtils");

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  sendResponse(res, 200, user, "Profile retrieved successfully");
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password -refreshToken");

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  sendResponse(res, 200, { user }, "Profile updated successfully");
});

exports.updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No image uploaded");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  if (user.profileImage) {
    const oldPath = path.join(__dirname, "..", user.profileImage);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  user.profileImage = `uploads/profile/${req.file.filename}`;
  await user.save();

  sendResponse(res, 200, { imagePath: user.profileImage }, "Profile image updated");
});

exports.deleteProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  sendResponse(res, 200, null, "Account deleted successfully");
});
