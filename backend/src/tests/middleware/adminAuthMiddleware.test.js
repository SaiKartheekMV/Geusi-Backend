const jwt = require("jsonwebtoken");
const { adminAuthMiddleware, requirePermission, requireRole } = require("../../middleware/adminAuthMiddleware");
const Admin = require("../../models/Admin");

jest.mock("../../models/Admin");
jest.mock("jsonwebtoken");

describe("adminAuthMiddleware", () => {
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

  describe("adminAuthMiddleware", () => {
    it("should authenticate admin with valid token", async () => {
      const mockAdmin = {
        _id: "admin123",
        email: "admin@test.com",
        accountStatus: "active",
      };

      jwt.verify.mockReturnValue({ userId: "admin123" });
      Admin.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      mockReq.headers.authorization = "Bearer valid-token";

      await adminAuthMiddleware(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith("valid-token", process.env.JWT_ACCESS_SECRET);
      expect(Admin.findById).toHaveBeenCalledWith("admin123");
      expect(mockReq.user).toEqual(mockAdmin);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should reject request without authorization header", async () => {
      await adminAuthMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Access token required" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with invalid authorization format", async () => {
      mockReq.headers.authorization = "InvalidFormat token";

      await adminAuthMiddleware(mockReq, mockRes, mockNext);

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

      await adminAuthMiddleware(mockReq, mockRes, mockNext);

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

      await adminAuthMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid access token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request when admin not found", async () => {
      jwt.verify.mockReturnValue({ userId: "nonexistent" });
      Admin.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      mockReq.headers.authorization = "Bearer valid-token";

      await adminAuthMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Admin not found" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request when admin account is inactive", async () => {
      const mockAdmin = {
        _id: "admin123",
        email: "admin@test.com",
        accountStatus: "inactive",
      };

      jwt.verify.mockReturnValue({ userId: "admin123" });
      Admin.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      mockReq.headers.authorization = "Bearer valid-token";

      await adminAuthMiddleware(mockReq, mockRes, mockNext);

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

      await adminAuthMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Authentication failed" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("requirePermission", () => {
    beforeEach(() => {
      mockReq.user = {
        permissions: {
          userManagement: true,
          orderManagement: false,
        },
      };
    });

    it("should allow access when user has required permission", () => {
      const middleware = requirePermission("userManagement");

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should deny access when user lacks required permission", () => {
      const middleware = requirePermission("orderManagement");

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied. Required permission: orderManagement",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when user is not authenticated", () => {
      mockReq.user = null;
      const middleware = requirePermission("userManagement");

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied. Required permission: userManagement",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when permissions object is missing", () => {
      mockReq.user = { permissions: null };
      const middleware = requirePermission("userManagement");

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied. Required permission: userManagement",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    beforeEach(() => {
      mockReq.user = {
        role: "admin",
      };
    });

    it("should allow access when user has required role", () => {
      const middleware = requireRole(["admin"]);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow access when user has one of multiple required roles", () => {
      const middleware = requireRole(["admin", "superadmin"]);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should deny access when user lacks required role", () => {
      const middleware = requireRole(["superadmin"]);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied. Required role: superadmin",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when user is not authenticated", () => {
      mockReq.user = null;
      const middleware = requireRole(["admin"]);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied. Required role: admin",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when user role is missing", () => {
      mockReq.user = {};
      const middleware = requireRole(["admin"]);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied. Required role: admin",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle multiple roles in error message", () => {
      const middleware = requireRole(["admin", "superadmin", "moderator"]);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
