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
const { validateRequest, schemas } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", validateRequest(schemas.userRegistration), register);
router.post("/login", validateRequest(schemas.login), login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.post("/refresh-token", refreshToken);
router.post("/change-password", authMiddleware, validateRequest(schemas.changePassword), changePassword);
router.post("/forgot-password", validateRequest(schemas.forgotPassword), forgotPassword);
router.post("/reset-password", validateRequest(schemas.resetPassword), resetPassword);

module.exports = router;