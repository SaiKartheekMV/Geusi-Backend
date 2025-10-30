const Chef = require("../models/Chef");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../utils/controllerUtils");

const getChefProfile = asyncHandler(async (req, res) => {
    const chefId = req.params.id || req.user._id;
    
    const chef = await Chef.findById(chefId)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    return sendResponse(res, 200, { chef }, "Chef profile retrieved successfully");
});

const updateChefProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, cuisineSpecialty, profileImage } = req.body;
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return sendErrorResponse(res, 404, "Chef not found");
    }
    
    if (firstName) chef.firstName = firstName;
    if (lastName) chef.lastName = lastName;
    if (cuisineSpecialty) chef.cuisineSpecialty = cuisineSpecialty;
    if (profileImage) chef.profileImage = profileImage;
    
    await chef.save();
    
    return sendResponse(res, 200, { 
      chef: {
        _id: chef._id,
        firstName: chef.firstName,
        lastName: chef.lastName,
        email: chef.email,
        phone: chef.phone,
        profileImage: chef.profileImage,
        cuisineSpecialty: chef.cuisineSpecialty,
        rating: chef.rating,
        isAvailable: chef.isAvailable
      }
    }, "Profile updated successfully");
});

module.exports = {
  getChefProfile,
  updateChefProfile
};
