const Chef = require("../models/Chef");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../utils/controllerUtils");

const getAvailability = asyncHandler(async (req, res) => {
    const chefId = req.params.id || req.user._id;
    
    const chef = await Chef.findById(chefId).select("availability serviceAreas isAvailable");
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    return sendResponse(res, 200, { availability: chef.availability, serviceAreas: chef.serviceAreas, isAvailable: chef.isAvailable }, "Chef availability retrieved successfully");
});

const updateSchedule = asyncHandler(async (req, res) => {
    const { schedule } = req.body;
    
    if (!Array.isArray(schedule)) {
      return sendErrorResponse(res, 400, "Schedule must be an array");
    }
    

    for (const day of schedule) {
      if (!day.day || !Array.isArray(day.slots)) {
        return sendErrorResponse(res, 400, "Invalid schedule format");
      }
      
      for (const slot of day.slots) {
        if (!slot.startTime || !slot.endTime) {
          return sendErrorResponse(res, 400, "Each slot must have startTime and endTime");
        }
      }
    }
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    chef.availability.schedule = schedule;
    await chef.save();
    
    return sendResponse(res, 200, { schedule: chef.availability.schedule }, "Schedule updated successfully");
});

const addUnavailableDates = asyncHandler(async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    
    if (!startDate || !endDate) {
      return sendErrorResponse(res, 400, "Start date and end date are required");
    }
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    chef.availability.unavailableDates.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || "Unavailable"
    });
    
    await chef.save();
    
    return sendResponse(res, 200, { unavailableDates: chef.availability.unavailableDates }, "Unavailable dates added successfully");
});

const removeUnavailableDates = asyncHandler(async (req, res) => {
    const { dateId } = req.params;
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    chef.availability.unavailableDates = chef.availability.unavailableDates.filter(
      date => date._id.toString() !== dateId
    );
    
    await chef.save();
    
    return sendResponse(res, 200, { unavailableDates: chef.availability.unavailableDates }, "Unavailable date removed successfully");
});

const updateServiceAreas = asyncHandler(async (req, res) => {
    const { serviceAreas } = req.body;
    
    if (!Array.isArray(serviceAreas)) {
      return sendErrorResponse(res, 400, "Service areas must be an array");
    }
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    chef.serviceAreas = serviceAreas;
    await chef.save();
    
    return sendResponse(res, 200, { serviceAreas: chef.serviceAreas }, "Service areas updated successfully");
});

const toggleAvailability = asyncHandler(async (req, res) => {
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    chef.isAvailable = !chef.isAvailable;
    await chef.save();
    
    return sendResponse(res, 200, { isAvailable: chef.isAvailable }, `Chef is now ${chef.isAvailable ? 'available' : 'unavailable'}`);
});

module.exports = {
  getAvailability,
  updateSchedule,
  addUnavailableDates,
  removeUnavailableDates,
  updateServiceAreas,
  toggleAvailability
};
