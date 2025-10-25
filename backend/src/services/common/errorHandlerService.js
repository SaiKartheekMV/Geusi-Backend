const logger = require("./loggerService");

const createErrorResponse = (message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (error && process.env.NODE_ENV === "development") {
    response.error = error.message;
    response.stack = error.stack;
  }

  return {
    statusCode,
    response,
  };
};

const createSuccessResponse = (data, message = "Operation successful", statusCode = 200) => {
  return {
    statusCode,
    response: {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  };
};

const handleControllerError = (error, req, res, operation = "operation") => {
  logger.logError(error, req, operation);

  if (error.name === "ValidationError") {
    const { statusCode, response } = createErrorResponse(
      "Validation failed",
      400,
      error
    );
    return res.status(statusCode).json(response);
  }

  if (error.name === "CastError") {
    const { statusCode, response } = createErrorResponse(
      "Invalid ID format",
      400,
      error
    );
    return res.status(statusCode).json(response);
  }

  if (error.name === "JsonWebTokenError") {
    const { statusCode, response } = createErrorResponse(
      "Invalid token",
      401,
      error
    );
    return res.status(statusCode).json(response);
  }

  if (error.name === "TokenExpiredError") {
    const { statusCode, response } = createErrorResponse(
      "Token expired",
      401,
      error
    );
    return res.status(statusCode).json(response);
  }

  if (error.code === 11000) {
    const { statusCode, response } = createErrorResponse(
      "Duplicate entry",
      409,
      error
    );
    return res.status(statusCode).json(response);
  }

  const { statusCode, response } = createErrorResponse(
    "Internal server error",
    500,
    error
  );
  return res.status(statusCode).json(response);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleControllerError(error, req, res, fn.name);
    });
  };
};

module.exports = {
  createErrorResponse,
  createSuccessResponse,
  handleControllerError,
  asyncHandler,
};
