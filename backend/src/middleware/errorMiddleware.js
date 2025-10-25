const { logError } = require("../services/loggerService");
const { handleControllerError } = require("../utils/controllerUtils");

const errorHandler = (err, req, res, next) => {
  logError(err, req);
  return handleControllerError(err, req, res, "Middleware");
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
