const Chef = require("../models/Chef");

/**
 * Get chef profile
 */
const getChefProfile = async (req, res) => {
  try {
    const chefId = req.params.id || req.user._id;
    
    const chef = await Chef.findById(chefId)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    return res.status(200).json(chef);
  } catch (error) {
    console.error("Error getting chef profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update chef profile
 */
const updateChefProfile = async (req, res) => {
  try {
    const { firstName, lastName, cuisineSpecialty, profileImage } = req.body;
    
    const chef = await Chef.findById(req.user._id);
    
    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    if (firstName) chef.firstName = firstName;
    if (lastName) chef.lastName = lastName;
    if (cuisineSpecialty) chef.cuisineSpecialty = cuisineSpecialty;
    if (profileImage) chef.profileImage = profileImage;
    
    await chef.save();
    
    return res.status(200).json({ 
      message: "Profile updated successfully",
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
    });
  } catch (error) {
    console.error("Error updating chef profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getChefProfile,
  updateChefProfile
};
