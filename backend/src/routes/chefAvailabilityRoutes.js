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


router.get("/:id", authMiddleware, getAvailability);

router.get("/", authMiddleware, getAvailability);


router.put("/schedule", authMiddleware, updateSchedule);


router.post("/unavailable", authMiddleware, addUnavailableDates);


router.delete("/unavailable/:dateId", authMiddleware, removeUnavailableDates);


router.put("/service-areas", authMiddleware, updateServiceAreas);


router.put("/toggle", authMiddleware, toggleAvailability);

module.exports = router;
