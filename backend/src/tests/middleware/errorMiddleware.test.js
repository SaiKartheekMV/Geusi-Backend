const { errorHandler, notFoundHandler, asyncHandler } = require("../../middleware/errorMiddleware");
const { logError } = require("../../services/loggerService");

jest.mock("../../services/loggerService");

describe("errorMiddleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      url: "/test",
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("errorHandler", () => {
    it("should handle ValidationError", () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      validationError.errors = {
        email: { message: "Email is required" },
        password: { message: "Password must be at least 6 characters" },
      };

      errorHandler(validationError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(validationError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
        error: "Validation failed",
        timestamp: expect.any(String),
      });
    });

    it("should handle CastError", () => {
      const castError = new Error("Invalid ID");
      castError.name = "CastError";

      errorHandler(castError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(castError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid ID format",
        error: "Invalid ID",
        timestamp: expect.any(String),
      });
    });

    it("should handle MongoError with duplicate key", () => {
      const mongoError = new Error("Duplicate key");
      mongoError.name = "MongoError";
      mongoError.code = 11000;
      mongoError.keyPattern = { email: 1 };

      errorHandler(mongoError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(mongoError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Duplicate entry",
        error: "Duplicate key",
        timestamp: expect.any(String),
      });
    });

    it("should handle JsonWebTokenError", () => {
      const jwtError = new Error("Invalid token");
      jwtError.name = "JsonWebTokenError";

      errorHandler(jwtError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(jwtError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid token",
        error: "Invalid token",
        timestamp: expect.any(String),
      });
    });

    it("should handle TokenExpiredError", () => {
      const tokenExpiredError = new Error("Token expired");
      tokenExpiredError.name = "TokenExpiredError";

      errorHandler(tokenExpiredError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(tokenExpiredError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expired",
        error: "Token expired",
        timestamp: expect.any(String),
      });
    });

    it("should handle MulterError - LIMIT_FILE_SIZE", () => {
      const multerError = new Error("File too large");
      multerError.name = "MulterError";
      multerError.code = "LIMIT_FILE_SIZE";

      errorHandler(multerError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(multerError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "File too large",
        error: "File too large",
        timestamp: expect.any(String),
      });
    });

    it("should handle MulterError - LIMIT_FILE_COUNT", () => {
      const multerError = new Error("Too many files");
      multerError.name = "MulterError";
      multerError.code = "LIMIT_FILE_COUNT";

      errorHandler(multerError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(multerError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Too many files",
        error: "Too many files",
        timestamp: expect.any(String),
      });
    });

    it("should handle MulterError - LIMIT_UNEXPECTED_FILE", () => {
      const multerError = new Error("Unexpected file field");
      multerError.name = "MulterError";
      multerError.code = "LIMIT_UNEXPECTED_FILE";

      errorHandler(multerError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(multerError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Unexpected file field",
        error: "Unexpected file field",
        timestamp: expect.any(String),
      });
    });

    it("should handle generic error with statusCode", () => {
      const genericError = new Error("Custom error");
      genericError.statusCode = 422;

      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(genericError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Custom error",
        error: "Custom error",
        timestamp: expect.any(String),
      });
    });

    it("should handle generic error with status", () => {
      const genericError = new Error("Custom error");
      genericError.status = 422;

      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(genericError, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Custom error",
        error: "Custom error",
        timestamp: expect.any(String),
      });
    });

    it("should handle error without message", () => {
      const errorWithoutMessage = {};

      errorHandler(errorWithoutMessage, mockReq, mockRes, mockNext);

      expect(logError).toHaveBeenCalledWith(errorWithoutMessage, mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: {},
        timestamp: expect.any(String),
      });
    });

    it("should include stack trace in development environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const genericError = new Error("Test error");
      genericError.stack = "Error: Test error\n    at test.js:1:1";

      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Test error",
        stack: "Error: Test error\n    at test.js:1:1",
        timestamp: expect.any(String),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should not include stack trace in production environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const genericError = new Error("Test error");
      genericError.stack = "Error: Test error\n    at test.js:1:1";

      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Test error",
        timestamp: expect.any(String),
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("notFoundHandler", () => {
    it("should return 404 with route information", () => {
      mockReq.originalUrl = "/api/nonexistent";

      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Route not found",
        path: "/api/nonexistent",
        timestamp: expect.any(String),
      });
    });

    it("should handle request without originalUrl", () => {
      delete mockReq.originalUrl;

      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Route not found",
        path: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe("asyncHandler", () => {
    it("should handle successful async function", async () => {
      const asyncFn = jest.fn().mockResolvedValue("success");

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle async function that throws error", async () => {
      const error = new Error("Async error");
      const asyncFn = jest.fn().mockRejectedValue(error);

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle async function that returns rejected promise", async () => {
      const error = new Error("Promise rejected");
      const asyncFn = jest.fn().mockReturnValue(Promise.reject(error));

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle synchronous function", async () => {
      const syncFn = jest.fn().mockReturnValue("sync result");

      const wrappedFn = asyncHandler(syncFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(syncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

  });
});
