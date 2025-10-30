const createApiResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

const createSuccessResponse = (message, data = null, meta = null) => {
  return createApiResponse(true, message, data, meta);
};

const createErrorResponse = (message, error = null, meta = null) => {
  const response = createApiResponse(false, message, null, meta);

  if (error && process.env.NODE_ENV === "development") {
    response.error = {
      message: error.message,
      stack: error.stack,
    };
  }

  return response;
};

const createPaginatedResponse = (message, data, pagination) => {
  return createApiResponse(true, message, data, { pagination });
};

const createValidationErrorResponse = (errors) => {
  return createApiResponse(false, "Validation failed", null, { errors });
};

module.exports = {
  createApiResponse,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createValidationErrorResponse,
};
