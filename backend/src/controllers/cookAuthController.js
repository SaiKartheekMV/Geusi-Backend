const Chef = require("../models/Chef");
const authService = require("../services/authService");

const register = async (req, res) => {
  return authService.register(req, res, Chef, "chef");
};

const login = async (req, res) => {
  return authService.login(req, res, Chef, "chef");
};

const logout = async (req, res) => {
  return authService.logout(req, res, Chef);
};

const me = async (req, res) => {
  return authService.me(req, res, "chef");
};

const refreshToken = async (req, res) => {
  return authService.refreshToken(req, res, Chef);
};

const changePassword = async (req, res) => {
  return authService.changePassword(req, res, Chef);
};

const forgotPassword = async (req, res) => {
  return authService.forgotPassword(req, res, Chef);
};

const resetPassword = async (req, res) => {
  return authService.resetPassword(req, res, Chef);
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