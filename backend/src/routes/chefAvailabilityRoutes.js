const express = require("express");
const router = express.Router();
const { 
  getAvailability, 
  updateSchedule, 
  addUnavailableDates, 
  removeUnavailableDates, 
  updateServiceAreas, 
  toggleAvailability 
} = require("../controllers/chefAvailabilityController");
const authMiddleware = require("../middleware/authMiddleware");

// Get chef's availability (public and private)
router.get("/:id", authMiddleware, getAvailability);
// Get current chef's availability
router.get("/", authMiddleware, getAvailability);

// Update chef's weekly schedule (chef only)
router.put("/schedule", authMiddleware, updateSchedule);

// Add unavailable dates (chef only)
router.post("/unavailable", authMiddleware, addUnavailableDates);

// Remove unavailable dates (chef only)
router.delete("/unavailable/:dateId", authMiddleware, removeUnavailableDates);

// Update service areas (chef only)
router.put("/service-areas", authMiddleware, updateServiceAreas);

// Toggle availability status (chef only)
router.put("/toggle", authMiddleware, toggleAvailability);

module.exports = router;