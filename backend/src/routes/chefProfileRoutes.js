const express = require("express");
const router = express.Router();
const { getChefProfile, updateChefProfile } = require("../controllers/chefProfileController");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/:id", authMiddleware, getChefProfile);

router.get("/", authMiddleware, getChefProfile);


router.put("/", authMiddleware, updateChefProfile);

module.exports = router;
