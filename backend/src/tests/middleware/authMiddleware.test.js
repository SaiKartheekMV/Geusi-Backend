const jwt = require("jsonwebtoken");
const authMiddleware = require("../../middleware/authMiddleware");
const User = require("../../models/user");

jest.mock("../../models/user");
jest.mock("jsonwebtoken");

describe("authMiddleware", () => {
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

  it("should authenticate user with valid token", async () => {
    const mockUser = {
      _id: "user123",
      email: "user@test.com",
      accountStatus: "active",
    };

    jwt.verify.mockReturnValue({ userId: "user123" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", process.env.JWT_ACCESS_SECRET);
    expect(User.findById).toHaveBeenCalledWith("user123");
    expect(mockReq.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should reject request without authorization header", async () => {
    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid authorization format", async () => {
    mockReq.headers.authorization = "InvalidFormat token";

    await authMiddleware(mockReq, mockRes, mockNext);

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

    await authMiddleware(mockReq, mockRes, mockNext);

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

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid access token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request when user not found", async () => {
    jwt.verify.mockReturnValue({ userId: "nonexistent" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request when user account is inactive", async () => {
    const mockUser = {
      _id: "user123",
      email: "user@test.com",
      accountStatus: "inactive",
    };

    jwt.verify.mockReturnValue({ userId: "user123" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Account is not active" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request when user account is suspended", async () => {
    const mockUser = {
      _id: "user123",
      email: "user@test.com",
      accountStatus: "suspended",
    };

    jwt.verify.mockReturnValue({ userId: "user123" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await authMiddleware(mockReq, mockRes, mockNext);

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

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Authentication failed" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle database errors during user lookup", async () => {
    const dbError = new Error("Database connection failed");
    jwt.verify.mockReturnValue({ userId: "user123" });
    User.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(dbError)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Authentication failed" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle empty authorization header", async () => {
    mockReq.headers.authorization = "";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle authorization header without Bearer prefix", async () => {
    mockReq.headers.authorization = "Basic token123";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle authorization header with only Bearer", async () => {
    mockReq.headers.authorization = "Bearer";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle authorization header with Bearer and space but no token", async () => {
    const invalidError = new Error("Invalid token");
    invalidError.name = "JsonWebTokenError";

    jwt.verify.mockImplementation(() => {
      throw invalidError;
    });

    mockReq.headers.authorization = "Bearer ";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid access token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call User.findById with correct select fields", async () => {
    const mockUser = {
      _id: "user123",
      email: "user@test.com",
      accountStatus: "active",
    };

    jwt.verify.mockReturnValue({ userId: "user123" });
    const mockSelect = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: mockSelect });

    mockReq.headers.authorization = "Bearer valid-token";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(User.findById).toHaveBeenCalledWith("user123");
    expect(mockSelect).toHaveBeenCalledWith("-password -refreshToken -resetPasswordToken -resetPasswordExpires");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle user with pending account status", async () => {
    const mockUser = {
      _id: "user123",
      email: "user@test.com",
      accountStatus: "pending",
    };

    jwt.verify.mockReturnValue({ userId: "user123" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    mockReq.headers.authorization = "Bearer valid-token";

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Account is not active" });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
