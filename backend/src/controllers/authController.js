const User = require("../models/User");
const authService = require("../services/authService");

const register = async (req, res) => {
  return authService.register(req, res, User, "user");
};

const login = async (req, res) => {
  return authService.login(req, res, User, "user");
};

const logout = async (req, res) => {
  return authService.logout(req, res, User);
};

const me = async (req, res) => {
  return authService.me(req, res, "user");
};

const refreshToken = async (req, res) => {
  return authService.refreshToken(req, res, User);
};

const changePassword = async (req, res) => {
  return authService.changePassword(req, res, User);
};

const forgotPassword = async (req, res) => {
  return authService.forgotPassword(req, res, User);
};

const resetPassword = async (req, res) => {
  return authService.resetPassword(req, res, User);
};

module.exports = {
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
