const User = require("../../models/User");
const Chef = require("../../models/Chef");

const calculateCompatibilityScore = (userPreferences, chef) => {
  let score = 0;

  if (userPreferences.cuisines && chef.cuisineSpecialty) {
    const matchingCuisines = userPreferences.cuisines.filter(cuisine =>
      chef.cuisineSpecialty.some(specialty =>
        specialty.toLowerCase().includes(cuisine.toLowerCase())
      )
    );
    score += matchingCuisines.length * 20;
  }

  if (userPreferences.dietaryType === chef.cuisineSpecialty?.some(specialty =>
    specialty.toLowerCase().includes(userPreferences.dietaryType.toLowerCase())
  )) {
    score += 30;
  }

  score += chef.rating * 10;

  return Math.min(score, 100);
};

const getAssignmentRecommendations = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { recommendations: [], error: "User not found" };
    }

    const userPreferences = user.preferences || {};
    const userAllergies = userPreferences.allergies || [];
    const userDietaryType = userPreferences.dietaryType || "Veg";

    let chefQuery = {
      accountStatus: "active",
      isAvailable: true,
    };

    if (userDietaryType === "Veg") {
      chefQuery.cuisineSpecialty = { $nin: ["Non-Veg"] };
    }

    const chefs = await Chef.find(chefQuery)
      .select("firstName lastName cuisineSpecialty rating")
      .sort({ rating: -1 });

    const recommendations = chefs
      .filter(chef => {
        if (userAllergies.length > 0 && chef.cuisineSpecialty) {
          const hasIncompatibleCuisine = chef.cuisineSpecialty.some(specialty =>
            userAllergies.some(allergy =>
              specialty.toLowerCase().includes(allergy.toLowerCase())
            )
          );
          return !hasIncompatibleCuisine;
        }
        return true;
      })
      .slice(0, 5)
      .map(chef => ({
        chefId: chef._id,
        chefName: `${chef.firstName} ${chef.lastName}`,
        cuisineSpecialty: chef.cuisineSpecialty,
        rating: chef.rating,
        compatibilityScore: calculateCompatibilityScore(userPreferences, chef),
      }));

    return { recommendations };
  } catch (error) {
    return { recommendations: [], error: error.message };
  }
};

module.exports = {
  getAssignmentRecommendations,
  calculateCompatibilityScore,
};
