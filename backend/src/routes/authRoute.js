const express = require("express");
const { 
  register, 
  login, 
  logout, 
  me, 
  refreshToken, 
  changePassword, 
  forgotPassword, 
  resetPassword 
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.post("/refresh-token", refreshToken);
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;