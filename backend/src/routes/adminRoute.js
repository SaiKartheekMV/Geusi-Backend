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
  getDashboardStats,
  getPendingRequests,
  getProcessedRequests,
  getChefStatus,
  approveRequest,
  rejectRequest,
  assignChef,
} = require("../controllers/adminController");
const { adminAuthMiddleware, requirePermission, requireRole } = require("../middleware/adminAuthMiddleware");
const { validateRequest, schemas } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", requireRole(["super_admin"]), validateRequest(schemas.adminRegistration), register);
router.post("/login", validateRequest(schemas.login), login);
router.post("/logout", logout);
router.get("/me", adminAuthMiddleware, me);
router.post("/refresh-token", refreshToken);
router.post("/change-password", adminAuthMiddleware, validateRequest(schemas.changePassword), changePassword);
router.post("/forgot-password", validateRequest(schemas.forgotPassword), forgotPassword);
router.post("/reset-password", validateRequest(schemas.resetPassword), resetPassword);
router.get("/dashboard/stats", adminAuthMiddleware, getDashboardStats);
router.get("/dashboard/pending-requests", adminAuthMiddleware, getPendingRequests);
router.get("/dashboard/processed-requests", adminAuthMiddleware, getProcessedRequests);
router.get("/dashboard/chef-status", adminAuthMiddleware, getChefStatus);
router.patch("/requests/:id/approve", adminAuthMiddleware, approveRequest);
router.patch("/requests/:id/reject", adminAuthMiddleware, rejectRequest);
router.post("/requests/:orderId/assign-chef", adminAuthMiddleware, assignChef);

module.exports = router;
