const express = require("express");
const {
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/cookAuthController");
const cookAuthMiddleware = require("../middleware/cookAuthMiddleware");
const { validateRequest, schemas } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", validateRequest(schemas.chefRegistration), register);
router.post("/login", validateRequest(schemas.login), login);
router.post("/logout", logout);
router.get("/me", cookAuthMiddleware, me);
router.post("/refresh-token", refreshToken);
router.post("/change-password", cookAuthMiddleware, validateRequest(schemas.changePassword), changePassword);
router.post("/forgot-password", validateRequest(schemas.forgotPassword), forgotPassword);
router.post("/reset-password", validateRequest(schemas.resetPassword), resetPassword);

module.exports = router;


