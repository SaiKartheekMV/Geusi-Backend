const express = require("express");
const router = express.Router();
const { getChefProfile, updateChefProfile } = require("../controllers/chefProfileController");
const authMiddleware = require("../middleware/authMiddleware");

// Get chef profile (public and private)
router.get("/:id", authMiddleware, getChefProfile);
// Get current chef profile
router.get("/", authMiddleware, getChefProfile);

// Update chef profile (chef only)
router.put("/", authMiddleware, updateChefProfile);

module.exports = router;