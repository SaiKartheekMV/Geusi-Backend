const Assignment = require("../models/Assignment");
const User = require("../models/User");
const Chef = require("../models/Chef");
const Order = require("../models/Order");

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

const validateAssignmentUpdate = async (assignmentId, updateData) => {
  const errors = [];
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    errors.push("Assignment not found");
    return { isValid: false, errors };
  }

  if (updateData.status) {
    const validTransitions = {
      active: ["inactive", "suspended", "completed"],
      inactive: ["active"],
      suspended: ["active", "completed"],
      completed: [],
    };

    if (!validTransitions[assignment.status]?.includes(updateData.status)) {
      errors.push(`Invalid status transition from ${assignment.status} to ${updateData.status}`);
    }

    if (updateData.status === "completed") {
      const activeOrders = await Order.countDocuments({
        assignment: assignmentId,
        status: { $in: ["new", "confirmed", "preparing", "on_the_way"] },
      });

      if (activeOrders > 0) {
        errors.push("Cannot complete assignment with active orders");
      }
    }
  }

  if (updateData.endDate && new Date(updateData.endDate) <= new Date()) {
    errors.push("End date must be in the future");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateAssignmentDeletion = async (assignmentId) => {
  const errors = [];
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    errors.push("Assignment not found");
    return { isValid: false, errors };
  }

  const activeOrders = await Order.countDocuments({
    assignment: assignmentId,
    status: { $in: ["new", "confirmed", "preparing", "on_the_way"] },
  });

  if (activeOrders > 0) {
    errors.push("Cannot delete assignment with active orders");
  }

  const completedOrders = await Order.countDocuments({
    assignment: assignmentId,
    status: "delivered",
  });

  if (completedOrders > 0 && assignment.status !== "completed") {
    errors.push("Assignment has completed orders and should be marked as completed before deletion");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
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
      chefQuery.cuisineSpecialty = { $nin: ["Non-Veg", "non-veg"] };
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

module.exports = {
  validateAssignmentConstraints,
  validateAssignmentUpdate,
  validateAssignmentDeletion,
  getAssignmentRecommendations,
  calculateCompatibilityScore,
};
