const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("./tokenService");
const { validateRegistrationData, checkExistingUser } = require("./validationService");
const { createUserResponse } = require("./responseService");

const register = async (req, res, Model, userType = "user") => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    const validation = validateRegistrationData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }
    
    const existingCheck = await checkExistingUser(Model, email, phone);
    if (existingCheck.exists) {
      return res.status(400).json({ message: existingCheck.error });
    }
    
    const user = new Model({
      firstName,
      lastName,
      email,
      phone,
      password,
    });
    
    await user.save();
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    const userResponse = createUserResponse(user, userType);
    
    res.status(201).json({
      message: `${userType === "chef" ? "Cook" : "User"} registered successfully`,
      [userType === "chef" ? "cook" : "user"]: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(`${userType} registration error:`, error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const login = async (req, res, Model, userType = "user") => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const user = await Model.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    if (user.accountStatus !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    const userResponse = createUserResponse(user, userType);
    
    res.status(200).json({
      message: "Login successful",
      [userType === "chef" ? "cook" : "user"]: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(`${userType} login error:`, error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const logout = async (req, res, Model) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await Model.findById(decoded.userId);
    
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(200).json({ message: "Logout successful" });
  }
};

const me = async (req, res, userType = "user") => {
  try {
    const userResponse = createUserResponse(req.user, userType);
    
    res.status(200).json({ 
      [userType === "chef" ? "cook" : "user"]: userResponse 
    });
  } catch (error) {
    console.error(`Get ${userType} error:`, error);
    res.status(500).json({ 
      message: `Failed to get ${userType} data`, 
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
};
