const createUserResponse = (user, userType = "user") => {
  const baseResponse = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    accountStatus: user.accountStatus,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
  };
  
  if (userType === "chef") {
    return {
      ...baseResponse,
      cuisineSpecialty: user.cuisineSpecialty,
      rating: user.rating,
      isAvailable: user.isAvailable,
    };
  }
  
  return {
    ...baseResponse,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    householdSize: user.householdSize,
    preferences: user.preferences,
    subscription: user.subscription,
  };
};

module.exports = {
  createUserResponse,
};
