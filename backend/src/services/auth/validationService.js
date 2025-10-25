const validateRegistrationData = (data) => {
  const { firstName, lastName, email, phone, password } = data;
  
  if (!firstName || !lastName || !email || !phone || !password) {
    return { isValid: false, error: "All fields are required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  
  return { isValid: true };
};

const checkExistingUser = async (Model, email, phone) => {
  const existingUser = await Model.findOne({
    $or: [{ email }, { phone }],
  });
  
  if (existingUser) {
    if (existingUser.email === email) {
      return { exists: true, error: "Email already registered" };
    }
    if (existingUser.phone === phone) {
      return { exists: true, error: "Phone number already registered" };
    }
  }
  
  return { exists: false };
};

module.exports = {
  validateRegistrationData,
  checkExistingUser,
};
