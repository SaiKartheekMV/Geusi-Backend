const Chef = require("../models/Chef");

/**
 * Get chef's availability
 */
const getAvailability = async (req, res) => {
  try {
    const chefId = req.params.id || req.user._id;
    
    const chef = await Chef.findById(chefId).select("availability serviceAreas isAvailable");
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    return res.status(200).json(chef);
  } catch (error) {
    console.error("Error getting chef availability:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update chef's weekly schedule
 */
const updateSchedule = async (req, res) => {
  try {
    const { schedule } = req.body;
    
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ message: "Schedule must be an array" });
    }
    

    for (const day of schedule) {
      if (!day.day || !Array.isArray(day.slots)) {
        return res.status(400).json({ message: "Invalid schedule format" });
      }
      
      for (const slot of day.slots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({ message: "Each slot must have startTime and endTime" });
        }
      }
    }
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    chef.availability.schedule = schedule;
    await chef.save();
    
    return res.status(200).json({ message: "Schedule updated successfully", schedule: chef.availability.schedule });
  } catch (error) {
    console.error("Error updating chef schedule:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Add unavailable dates
 */
const addUnavailableDates = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    chef.availability.unavailableDates.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || "Unavailable"
    });
    
    await chef.save();
    
    return res.status(200).json({ 
      message: "Unavailable dates added successfully", 
      unavailableDates: chef.availability.unavailableDates 
    });
  } catch (error) {
    console.error("Error adding unavailable dates:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Remove unavailable dates
 */
const removeUnavailableDates = async (req, res) => {
  try {
    const { dateId } = req.params;
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    chef.availability.unavailableDates = chef.availability.unavailableDates.filter(
      date => date._id.toString() !== dateId
    );
    
    await chef.save();
    
    return res.status(200).json({ 
      message: "Unavailable date removed successfully", 
      unavailableDates: chef.availability.unavailableDates 
    });
  } catch (error) {
    console.error("Error removing unavailable dates:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update service areas
 */
const updateServiceAreas = async (req, res) => {
  try {
    const { serviceAreas } = req.body;
    
    if (!Array.isArray(serviceAreas)) {
      return res.status(400).json({ message: "Service areas must be an array" });
    }
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    chef.serviceAreas = serviceAreas;
    await chef.save();
    
    return res.status(200).json({ 
      message: "Service areas updated successfully", 
      serviceAreas: chef.serviceAreas 
    });
  } catch (error) {
    console.error("Error updating service areas:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Toggle availability status
 */
const toggleAvailability = async (req, res) => {
  try {
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    chef.isAvailable = !chef.isAvailable;
    await chef.save();
    
    return res.status(200).json({ 
      message: `Chef is now ${chef.isAvailable ? 'available' : 'unavailable'}`, 
      isAvailable: chef.isAvailable 
    });
  } catch (error) {
    console.error("Error toggling availability:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAvailability,
  updateSchedule,
  addUnavailableDates,
  removeUnavailableDates,
  updateServiceAreas,
  toggleAvailability
};
