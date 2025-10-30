const Assignment = require("../../models/Assignment");

const updateSubscriptionPreferences = async (assignmentId, preferences) => {
  try {
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.assignmentType !== "subscription") {
      throw new Error("Invalid subscription assignment");
    }

    if (assignment.status !== "active") {
      throw new Error("Cannot update preferences for inactive subscription");
    }

    const { cuisines, dietaryRestrictions, allergies } = preferences;

    assignment.subscriptionDetails.mealPreferences = {
      cuisines: cuisines || assignment.subscriptionDetails.mealPreferences?.cuisines || [],
      dietaryRestrictions: dietaryRestrictions || assignment.subscriptionDetails.mealPreferences?.dietaryRestrictions || [],
      allergies: allergies || assignment.subscriptionDetails.mealPreferences?.allergies || [],
    };

    await assignment.save();

    return {
      success: true,
      message: "Subscription preferences updated successfully",
      preferences: assignment.subscriptionDetails.mealPreferences,
    };
  } catch (error) {
    console.error("Update subscription preferences error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  updateSubscriptionPreferences,
};
