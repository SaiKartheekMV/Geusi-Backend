const Assignment = require("../../models/Assignment");
const User = require("../../models/user");
const Chef = require("../../models/Chef");
const { logger } = require("../loggerService");

const createServiceResponse = (success, data = null, message = "", error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (success && data !== null) {
    response.data = data;
  }

  if (!success && error) {
    response.error = error.message || error;
    if (process.env.NODE_ENV === "development" && error.stack) {
      response.stack = error.stack;
    }
  }

  return response;
};

const validateAssignmentConstraints = async (assignmentData) => {
  try {
    if (!assignmentData) {
      return createServiceResponse(false, null, "Assignment data is required", new Error("Invalid parameters"));
    }

    const { userId, chefId, assignmentType, subscriptionDetails } = assignmentData;
    const errors = [];

    if (!userId || !chefId) {
      return createServiceResponse(false, null, "User ID and Chef ID are required", new Error("Missing required fields"));
    }

    let user, chef;

    try {
      user = await User.findById(userId);
    } catch (error) {
      logger.error("Error finding user:", error);
      errors.push("Error validating user");
    }

    try {
      chef = await Chef.findById(chefId);
    } catch (error) {
      logger.error("Error finding chef:", error);
      errors.push("Error validating chef");
    }

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

    if (user && chef) {
      try {
        const existingAssignment = await Assignment.findOne({
          user: userId,
          chef: chefId,
          status: { $in: ["active", "suspended"] },
        });

        if (existingAssignment) {
          errors.push("An active assignment already exists between this user and chef");
        }
      } catch (error) {
        logger.error("Error checking existing assignment:", error);
        errors.push("Error validating existing assignments");
      }

      try {
        const userActiveAssignments = await Assignment.countDocuments({
          user: userId,
          status: "active",
        });

        if (userActiveAssignments >= 3) {
          errors.push("User already has maximum number of active assignments (3)");
        }
      } catch (error) {
        logger.error("Error counting user assignments:", error);
        errors.push("Error validating user assignment count");
      }

      try {
        const chefActiveAssignments = await Assignment.countDocuments({
          chef: chefId,
          status: "active",
        });

        if (chefActiveAssignments >= 10) {
          errors.push("Chef already has maximum number of active assignments (10)");
        }
      } catch (error) {
        logger.error("Error counting chef assignments:", error);
        errors.push("Error validating chef assignment count");
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

    const isValid = errors.length === 0;
    
    return createServiceResponse(isValid, {
      isValid,
      errors,
    }, isValid ? "Assignment validation passed" : "Assignment validation failed");

  } catch (error) {
    logger.error("Error validating assignment constraints:", error);
    return createServiceResponse(false, null, "Failed to validate assignment constraints", error);
  }
};

module.exports = {
  validateAssignmentConstraints,
};
