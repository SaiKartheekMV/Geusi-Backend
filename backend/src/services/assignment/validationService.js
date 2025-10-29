const Assignment = require("../../models/Assignment");
const User = require("../../models/user");
const Chef = require("../../models/Chef");

const validateAssignmentConstraints = async (assignmentData) => {
  const { userId, chefId, assignmentType, subscriptionDetails } = assignmentData;
  const errors = [];

  const user = await User.findById(userId);
  const chef = await Chef.findById(chefId);

  if (!user) {
    errors.push("User not found");
  } else if (user.accountStatus !== "active") {
    errors.push("User account is not active");
  }

  if (!chef) {
    errors.push("Chef not found");
  } else if (chef.accountStatus !== "active") {
    errors.push("Chef account is not active");
  } else if (!chef.isAvailable) {
    errors.push("Chef is not available for new assignments");
  }

  const existingAssignment = await Assignment.findOne({
    user: userId,
    chef: chefId,
    status: { $in: ["active", "suspended"] },
  });

  if (existingAssignment) {
    errors.push("An active assignment already exists between this user and chef");
  }

  const userActiveAssignments = await Assignment.countDocuments({
    user: userId,
    status: "active",
  });

  if (userActiveAssignments >= 3) {
    errors.push("User already has maximum number of active assignments (3)");
  }

  const chefActiveAssignments = await Assignment.countDocuments({
    chef: chefId,
    status: "active",
  });

  if (chefActiveAssignments >= 10) {
    errors.push("Chef already has maximum number of active assignments (10)");
  }

  if (assignmentType === "subscription") {
    if (!subscriptionDetails) {
      errors.push("Subscription details are required for subscription assignments");
    } else {
      if (!subscriptionDetails.planType) {
        errors.push("Plan type is required for subscription assignments");
      }
      if (subscriptionDetails.mealsPerWeek && subscriptionDetails.mealsPerWeek > 21) {
        errors.push("Maximum meals per week is 21");
      }
      if (subscriptionDetails.deliveryDays && subscriptionDetails.deliveryDays.length > 7) {
        errors.push("Maximum delivery days is 7");
      }
    }
  }

  if (user && chef) {
    const userPreferences = user.preferences;
    const chefSpecialties = chef.cuisineSpecialty;

    if (userPreferences && userPreferences.dietaryType === "Veg" && 
        chefSpecialties && chefSpecialties.includes("Non-Veg")) {
      errors.push("Cannot assign non-vegetarian chef to vegetarian user");
    }

    if (userPreferences && userPreferences.allergies && userPreferences.allergies.length > 0) {
      const incompatibleCuisines = userPreferences.allergies.filter(allergy => 
        chefSpecialties && chefSpecialties.some(specialty => 
          specialty.toLowerCase().includes(allergy.toLowerCase())
        )
      );
      
      if (incompatibleCuisines.length > 0) {
        errors.push(`Chef specializes in cuisines that may contain user's allergies: ${incompatibleCuisines.join(", ")}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateAssignmentConstraints,
};
