const { logger, logRequest, logError } = require("../../services/loggerService");

jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    add: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

describe("loggerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logger", () => {
    it("should be defined", () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe("logRequest", () => {
    it("should log HTTP request information", (done) => {
      const mockReq = {
        method: "GET",
        url: "/api/test",
        get: jest.fn().mockReturnValue("Mozilla/5.0"),
        ip: "127.0.0.1",
        connection: { remoteAddress: "127.0.0.1" },
      };

      const mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === "finish") {
            setTimeout(() => {
              callback();
              expect(logger.info).toHaveBeenCalledWith("HTTP Request", {
                method: "GET",
                url: "/api/test",
                status: 200,
                duration: expect.any(String),
                userAgent: "Mozilla/5.0",
                ip: "127.0.0.1",
              });
              done();
            }, 10);
          }
        }),
      };

      const mockNext = jest.fn();

      logRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle missing IP address", (done) => {
      const mockReq = {
        method: "POST",
        url: "/api/users",
        get: jest.fn().mockReturnValue("Mozilla/5.0"),
        ip: undefined,
        connection: { remoteAddress: "192.168.1.1" },
      };

      const mockRes = {
        statusCode: 201,
        on: jest.fn((event, callback) => {
          if (event === "finish") {
            setTimeout(() => {
              callback();
              expect(logger.info).toHaveBeenCalledWith("HTTP Request", {
                method: "POST",
                url: "/api/users",
                status: 201,
                duration: expect.any(String),
                userAgent: "Mozilla/5.0",
                ip: "192.168.1.1",
              });
              done();
            }, 10);
          }
        }),
      };

      const mockNext = jest.fn();

      logRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should calculate request duration correctly", (done) => {
      const mockReq = {
        method: "PUT",
        url: "/api/orders/123",
        get: jest.fn().mockReturnValue("Mozilla/5.0"),
        ip: "127.0.0.1",
        connection: { remoteAddress: "127.0.0.1" },
      };

      const mockRes = {
        statusCode: 404,
        on: jest.fn((event, callback) => {
          if (event === "finish") {
            setTimeout(() => {
              callback();
              expect(logger.info).toHaveBeenCalledWith("HTTP Request", {
                method: "PUT",
                url: "/api/orders/123",
                status: 404,
                duration: expect.stringMatching(/^\d+ms$/),
                userAgent: "Mozilla/5.0",
                ip: "127.0.0.1",
              });
              done();
            }, 10);
          }
        }),
      };

      const mockNext = jest.fn();

      logRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("logError", () => {
    it("should log error without request context", () => {
      const error = new Error("Test error message");
      error.stack = "Error stack trace";

      logError(error);

      expect(logger.error).toHaveBeenCalledWith("Application Error", {
        message: "Test error message",
        stack: "Error stack trace",
        timestamp: expect.any(String),
      });
    });

    it("should log error with request context", () => {
      const error = new Error("Validation error");
      error.stack = "Validation error stack";

      const mockReq = {
        method: "POST",
        url: "/api/users",
        body: { email: "test@example.com" },
        params: { id: "123" },
        query: { page: "1" },
        headers: { "content-type": "application/json" },
        ip: "127.0.0.1",
        connection: { remoteAddress: "127.0.0.1" },
      };

      logError(error, mockReq);

      expect(logger.error).toHaveBeenCalledWith("Application Error", {
        message: "Validation error",
        stack: "Validation error stack",
        timestamp: expect.any(String),
        request: {
          method: "POST",
          url: "/api/users",
          body: { email: "test@example.com" },
          params: { id: "123" },
          query: { page: "1" },
          headers: { "content-type": "application/json" },
          ip: "127.0.0.1",
        },
      });
    });

    it("should handle error without stack trace", () => {
      const error = new Error("Simple error");
      delete error.stack;

      logError(error);

      expect(logger.error).toHaveBeenCalledWith("Application Error", {
        message: "Simple error",
        stack: undefined,
        timestamp: expect.any(String),
      });
    });

    it("should handle request without IP", () => {
      const error = new Error("Network error");
      error.stack = "Network error stack";

      const mockReq = {
        method: "GET",
        url: "/api/health",
        body: {},
        params: {},
        query: {},
        headers: {},
        ip: undefined,
        connection: { remoteAddress: "192.168.1.100" },
      };

      logError(error, mockReq);

      expect(logger.error).toHaveBeenCalledWith("Application Error", {
        message: "Network error",
        stack: "Network error stack",
        timestamp: expect.any(String),
        request: {
          method: "GET",
          url: "/api/health",
          body: {},
          params: {},
          query: {},
          headers: {},
          ip: "192.168.1.100",
        },
      });
    });

    it("should generate valid ISO timestamp", () => {
      const error = new Error("Timestamp test");
      const beforeTime = new Date().toISOString();

      logError(error);

      const afterTime = new Date().toISOString();
      const loggedCall = logger.error.mock.calls[0];
      const loggedTimestamp = loggedCall[1].timestamp;

      expect(loggedTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(loggedTimestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(loggedTimestamp).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });
  });
});
