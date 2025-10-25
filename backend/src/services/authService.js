const { generateAccessToken, generateRefreshToken } = require("./auth/tokenService");
const { validateRegistrationData, checkExistingUser } = require("./auth/validationService");
const { createUserResponse } = require("./auth/responseService");
const { register, login, logout, me } = require("./auth/authOperations");
const { refreshToken } = require("./auth/tokenManagement");
const { changePassword, forgotPassword, resetPassword } = require("./auth/passwordService");

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  validateRegistrationData,
  checkExistingUser,
  createUserResponse,
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
