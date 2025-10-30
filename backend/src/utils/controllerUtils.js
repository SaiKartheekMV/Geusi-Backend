const { logError } = require("../services/loggerService");

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const createSuccessResponse = (data, message = "Success", statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

const createErrorResponse = (message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    response.error = error.message || error;
    if (process.env.NODE_ENV === "development" && error.stack) {
      response.stack = error.stack;
    }
  }

  return { statusCode, response };
};

const handleControllerError = (error, req, res, operation = "operation") => {
  logError(error, req);

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

  if (error.name === "MulterError") {
    let message = "File upload error";
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File too large";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "Too many files";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field";
    }
    
    const { statusCode, response } = createErrorResponse(
      message,
      400,
      error
    );
    return res.status(statusCode).json(response);
  }

  if (error.statusCode || error.status) {
    const statusCode = error.statusCode || error.status;
    const { response } = createErrorResponse(
      error.message || "Custom error",
      statusCode,
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

const calculatePagination = (page, limit, total) => {
  const skip = (page - 1) * limit;
  const pages = Math.ceil(total / limit);
  
  return {
    skip,
    pagination: {
      total,
      page: parseInt(page),
      pages,
      limit: parseInt(limit),
    },
  };
};

const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
      missingFields,
    };
  }
  
  return { isValid: true };
};

const sendResponse = (res, statusCode, data, message) => {
  const response = createSuccessResponse(data, message, statusCode);
  return res.status(statusCode).json(response);
};

const sendErrorResponse = (res, statusCode, message, error = null) => {
  const { response } = createErrorResponse(message, statusCode, error);
  return res.status(statusCode).json(response);
};

module.exports = {
  asyncHandler,
  createSuccessResponse,
  createErrorResponse,
  handleControllerError,
  calculatePagination,
  validateRequiredFields,
  sendResponse,
  sendErrorResponse,
};
