const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update profile (text fields)
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update profile image
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old image if exists
    if (user.profileImage) {
      const oldPath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profileImage = `uploads/profile/${req.file.filename}`;
    await user.save();

    res.status(200).json({ message: "Profile image updated", imagePath: user.profileImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete profile (soft delete or permanent)
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
