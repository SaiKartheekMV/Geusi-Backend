const jwt = require("jsonwebtoken");
const cookAuthMiddleware = require("../../middleware/cookAuthMiddleware");
const Chef = require("../../models/Chef");

jest.mock("../../models/Chef");
jest.mock("jsonwebtoken");

describe("cookAuthMiddleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it("should authenticate chef with valid token", async () => {
    const mockChef = {
      _id: "chef123",
      email: "chef@test.com",
      accountStatus: "active",
    };

    jwt.verify.mockReturnValue({ userId: "chef123" });
    Chef.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockChef)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", process.env.JWT_ACCESS_SECRET);
    expect(Chef.findById).toHaveBeenCalledWith("chef123");
    expect(mockReq.user).toEqual(mockChef);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should reject request without authorization header", async () => {
    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid authorization format", async () => {
    mockReq.headers.authorization = "InvalidFormat token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with expired token", async () => {
    const expiredError = new Error("Token expired");
    expiredError.name = "TokenExpiredError";

    jwt.verify.mockImplementation(() => {
      throw expiredError;
    });

    mockReq.headers.authorization = "Bearer expired-token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token expired" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid token", async () => {
    const invalidError = new Error("Invalid token");
    invalidError.name = "JsonWebTokenError";

    jwt.verify.mockImplementation(() => {
      throw invalidError;
    });

    mockReq.headers.authorization = "Bearer invalid-token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid access token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request when chef not found", async () => {
    jwt.verify.mockReturnValue({ userId: "nonexistent" });
    Chef.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Cook not found" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request when chef account is inactive", async () => {
    const mockChef = {
      _id: "chef123",
      email: "chef@test.com",
      accountStatus: "inactive",
    };

    jwt.verify.mockReturnValue({ userId: "chef123" });
    Chef.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockChef)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Account is not active" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors", async () => {
    const unexpectedError = new Error("Database connection failed");
    jwt.verify.mockImplementation(() => {
      throw unexpectedError;
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Authentication failed" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle database errors during chef lookup", async () => {
    const dbError = new Error("Database connection failed");
    jwt.verify.mockReturnValue({ userId: "chef123" });
    Chef.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(dbError)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Authentication failed" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle empty authorization header", async () => {
    mockReq.headers.authorization = "";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle authorization header without Bearer prefix", async () => {
    mockReq.headers.authorization = "Basic token123";

    await cookAuthMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
