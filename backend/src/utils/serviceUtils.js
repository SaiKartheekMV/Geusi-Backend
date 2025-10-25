const createServiceResponse = (success, data = null, message = "", error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (success && data !== null) {
    response.data = data;
  }

  if (!success && error) {
    response.error = error.message || error;
    if (process.env.NODE_ENV === "development" && error.stack) {
      response.stack = error.stack;
    }
  }

  return response;
};

const createSuccessServiceResponse = (data, message = "Operation successful") => {
  return createServiceResponse(true, data, message);
};

const createErrorServiceResponse = (message, error = null) => {
  return createServiceResponse(false, null, message, error);
};

const validateServiceInput = (data, requiredFields) => {
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

const handleServiceError = (error, operation = "service operation") => {
  console.error(`${operation} error:`, error);
  
  if (error.name === "ValidationError") {
    return createErrorServiceResponse("Validation failed", error);
  }
  
  if (error.name === "CastError") {
    return createErrorServiceResponse("Invalid ID format", error);
  }
  
  if (error.code === 11000) {
    return createErrorServiceResponse("Duplicate entry", error);
  }
  
  return createErrorServiceResponse("Internal service error", error);
};

module.exports = {
  createServiceResponse,
  createSuccessServiceResponse,
  createErrorServiceResponse,
  validateServiceInput,
  handleServiceError,
};
