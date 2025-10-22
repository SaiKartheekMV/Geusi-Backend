const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getProfile,
  updateProfile,
  updateProfileImage,
  deleteProfile,
} = require("../controllers/profileController");

// All routes require auth
router.use(authMiddleware);

router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/image", upload.single("profileImage"), updateProfileImage);
router.delete("/", deleteProfile);

module.exports = router;
