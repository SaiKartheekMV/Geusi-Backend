const request = require("supertest");
const express = require("express");
const {
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../../controllers/authController");

const authService = require("../../services/authService");
const User = require("../../models/user");

jest.mock("../../services/authService");
jest.mock("../../models/user");

describe("authController", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    it("should call authService.register with correct parameters", async () => {
      const mockReq = {
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "password123",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.register.mockResolvedValue({ success: true });

      await register(mockReq, mockRes);

      expect(authService.register).toHaveBeenCalledWith(mockReq, mockRes, User, "user");
    });

    it("should handle authService.register errors", async () => {
      const mockReq = {
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "password123",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Registration failed");
      authService.register.mockRejectedValue(error);

      try {
        await register(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.register).toHaveBeenCalledWith(mockReq, mockRes, User, "user");
    });
  });

  describe("POST /login", () => {
    it("should call authService.login with correct parameters", async () => {
      const mockReq = {
        body: {
          email: "john@example.com",
          password: "password123",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.login.mockResolvedValue({ success: true });

      await login(mockReq, mockRes);

      expect(authService.login).toHaveBeenCalledWith(mockReq, mockRes, User, "user");
    });

    it("should handle authService.login errors", async () => {
      const mockReq = {
        body: {
          email: "john@example.com",
          password: "wrongpassword",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Invalid credentials");
      authService.login.mockRejectedValue(error);

      try {
        await login(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.login).toHaveBeenCalledWith(mockReq, mockRes, User, "user");
    });
  });

  describe("POST /logout", () => {
    it("should call authService.logout with correct parameters", async () => {
      const mockReq = {
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.logout.mockResolvedValue({ success: true });

      await logout(mockReq, mockRes);

      expect(authService.logout).toHaveBeenCalledWith(mockReq, mockRes, User);
    });

    it("should handle authService.logout errors", async () => {
      const mockReq = {
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Logout failed");
      authService.logout.mockRejectedValue(error);

      try {
        await logout(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.logout).toHaveBeenCalledWith(mockReq, mockRes, User);
    });
  });

  describe("GET /me", () => {
    it("should call authService.me with correct parameters", async () => {
      const mockReq = {
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.me.mockResolvedValue({ success: true });

      await me(mockReq, mockRes);

      expect(authService.me).toHaveBeenCalledWith(mockReq, mockRes, "user");
    });

    it("should handle authService.me errors", async () => {
      const mockReq = {
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("User not found");
      authService.me.mockRejectedValue(error);

      try {
        await me(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.me).toHaveBeenCalledWith(mockReq, mockRes, "user");
    });
  });

  describe("POST /refresh-token", () => {
    it("should call authService.refreshToken with correct parameters", async () => {
      const mockReq = {
        body: {
          refreshToken: "valid-refresh-token",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.refreshToken.mockResolvedValue({ success: true });

      await refreshToken(mockReq, mockRes);

      expect(authService.refreshToken).toHaveBeenCalledWith(mockReq, mockRes, User);
    });

    it("should handle authService.refreshToken errors", async () => {
      const mockReq = {
        body: {
          refreshToken: "invalid-refresh-token",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Invalid refresh token");
      authService.refreshToken.mockRejectedValue(error);

      try {
        await refreshToken(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.refreshToken).toHaveBeenCalledWith(mockReq, mockRes, User);
    });
  });

  describe("POST /change-password", () => {
    it("should call authService.changePassword with correct parameters", async () => {
      const mockReq = {
        user: { _id: "user123" },
        body: {
          currentPassword: "oldpassword",
          newPassword: "newpassword123",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.changePassword.mockResolvedValue({ success: true });

      await changePassword(mockReq, mockRes);

      expect(authService.changePassword).toHaveBeenCalledWith(mockReq, mockRes, User);
    });

    it("should handle authService.changePassword errors", async () => {
      const mockReq = {
        user: { _id: "user123" },
        body: {
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Current password is incorrect");
      authService.changePassword.mockRejectedValue(error);

      try {
        await changePassword(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.changePassword).toHaveBeenCalledWith(mockReq, mockRes, User);
    });
  });

  describe("POST /forgot-password", () => {
    it("should call authService.forgotPassword with correct parameters", async () => {
      const mockReq = {
        body: {
          email: "john@example.com",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.forgotPassword.mockResolvedValue({ success: true });

      await forgotPassword(mockReq, mockRes);

      expect(authService.forgotPassword).toHaveBeenCalledWith(mockReq, mockRes, User);
    });

    it("should handle authService.forgotPassword errors", async () => {
      const mockReq = {
        body: {
          email: "nonexistent@example.com",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("User not found");
      authService.forgotPassword.mockRejectedValue(error);

      try {
        await forgotPassword(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.forgotPassword).toHaveBeenCalledWith(mockReq, mockRes, User);
    });
  });

  describe("POST /reset-password", () => {
    it("should call authService.resetPassword with correct parameters", async () => {
      const mockReq = {
        body: {
          token: "valid-reset-token",
          newPassword: "newpassword123",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authService.resetPassword.mockResolvedValue({ success: true });

      await resetPassword(mockReq, mockRes);

      expect(authService.resetPassword).toHaveBeenCalledWith(mockReq, mockRes, User);
    });

    it("should handle authService.resetPassword errors", async () => {
      const mockReq = {
        body: {
          token: "invalid-reset-token",
          newPassword: "newpassword123",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Invalid or expired token");
      authService.resetPassword.mockRejectedValue(error);

      try {
        await resetPassword(mockReq, mockRes);
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(authService.resetPassword).toHaveBeenCalledWith(mockReq, mockRes, User);
    });
  });

  describe("Controller Integration Tests", () => {
    beforeEach(() => {
      app.post("/register", register);
      app.post("/login", login);
      app.post("/logout", logout);
      app.get("/me", me);
      app.post("/refresh-token", refreshToken);
      app.post("/change-password", changePassword);
      app.post("/forgot-password", forgotPassword);
      app.post("/reset-password", resetPassword);
    });

    it("should handle register endpoint correctly", async () => {
      authService.register.mockImplementation((req, res, User, type) => {
        res.status(201).json({ success: true, message: "User registered successfully" });
      });

      const response = await request(app)
        .post("/register")
        .send({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "password123",
        });

      expect(authService.register).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it("should handle login endpoint correctly", async () => {
      authService.login.mockImplementation((req, res, User, type) => {
        res.status(200).json({ success: true, accessToken: "access-token", refreshToken: "refresh-token" });
      });

      const response = await request(app)
        .post("/login")
        .send({
          email: "john@example.com",
          password: "password123",
        });

      expect(authService.login).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle logout endpoint correctly", async () => {
      authService.logout.mockImplementation((req, res, User) => {
        res.status(200).json({ success: true, message: "Logged out successfully" });
      });

      const response = await request(app)
        .post("/logout")
        .send({});

      expect(authService.logout).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle me endpoint correctly", async () => {
      authService.me.mockImplementation((req, res, type) => {
        res.status(200).json({ success: true, user: { id: "user123", email: "john@example.com" } });
      });

      const response = await request(app)
        .get("/me")
        .send({});

      expect(authService.me).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle refresh-token endpoint correctly", async () => {
      authService.refreshToken.mockImplementation((req, res, User) => {
        res.status(200).json({ success: true, accessToken: "new-access-token" });
      });

      const response = await request(app)
        .post("/refresh-token")
        .send({
          refreshToken: "valid-refresh-token",
        });

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle change-password endpoint correctly", async () => {
      authService.changePassword.mockImplementation((req, res, User) => {
        res.status(200).json({ success: true, message: "Password changed successfully" });
      });

      const response = await request(app)
        .post("/change-password")
        .send({
          currentPassword: "oldpassword",
          newPassword: "newpassword123",
        });

      expect(authService.changePassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle forgot-password endpoint correctly", async () => {
      authService.forgotPassword.mockImplementation((req, res, User) => {
        res.status(200).json({ success: true, message: "Password reset email sent" });
      });

      const response = await request(app)
        .post("/forgot-password")
        .send({
          email: "john@example.com",
        });

      expect(authService.forgotPassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle reset-password endpoint correctly", async () => {
      authService.resetPassword.mockImplementation((req, res, User) => {
        res.status(200).json({ success: true, message: "Password reset successfully" });
      });

      const response = await request(app)
        .post("/reset-password")
        .send({
          token: "valid-reset-token",
          newPassword: "newpassword123",
        });

      expect(authService.resetPassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });
});
