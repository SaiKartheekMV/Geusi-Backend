const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { validateRequest, schemas } = require("../middleware/validationMiddleware");
const {
  getProfile,
  updateProfile,
  updateProfileImage,
  deleteProfile,
} = require("../controllers/profileController");

router.use(authMiddleware);

router.get("/", getProfile);
router.put("/", validateRequest(schemas.profileUpdate), updateProfile);
router.put("/image", upload.single("profileImage"), updateProfileImage);
router.delete("/", deleteProfile);

module.exports = router;
