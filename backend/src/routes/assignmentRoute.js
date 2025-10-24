const express = require("express");
const router = express.Router();
const { adminAuthMiddleware, requirePermission } = require("../middleware/adminAuthMiddleware");
const { validateRequest, validateParams, validateQuery, schemas } = require("../middleware/validationMiddleware");
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
  getAvailableChefs,
  getUsersWithoutChef,
  bulkAssignChefs,
  suspendAssignment,
  reactivateAssignment,
  getChefRecommendations,
} = require("../controllers/assignmentController");

router.use(adminAuthMiddleware);
router.use(requirePermission("assignmentManagement"));

router.post("/", validateRequest(schemas.assignmentCreation), createAssignment);
router.get("/", validateQuery(schemas.assignmentSearch), getAssignments);
router.get("/stats", validateQuery(schemas.assignmentStats), getAssignmentStats);
router.get("/available-chefs", validateQuery(schemas.availableChefs), getAvailableChefs);
router.get("/users-without-chef", validateQuery(schemas.pagination), getUsersWithoutChef);
router.get("/recommendations/:userId", validateParams(schemas.objectId), getChefRecommendations);
router.post("/bulk", validateRequest(schemas.bulkAssignment), bulkAssignChefs);
router.get("/:id", validateParams(schemas.objectId), getAssignmentById);
router.put("/:id", validateParams(schemas.objectId), validateRequest(schemas.assignmentUpdate), updateAssignment);
router.patch("/:id/suspend", validateParams(schemas.objectId), validateRequest(schemas.suspendAssignment), suspendAssignment);
router.patch("/:id/reactivate", validateParams(schemas.objectId), reactivateAssignment);
router.delete("/:id", validateParams(schemas.objectId), deleteAssignment);

module.exports = router;
