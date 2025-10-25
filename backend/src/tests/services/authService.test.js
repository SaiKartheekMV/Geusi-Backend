const authService = require('../../services/authService');
const User = require('../../models/user');
const Chef = require('../../models/Chef');
const {
  createTestUser,
  createTestChef,
  cleanupTestData
} = require('../helpers');

describe('Auth Service', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Token Generation', () => {
    test('should generate valid access token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = authService.generateAccessToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50);
    });

    test('should generate valid refresh token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = authService.generateRefreshToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50);
    });

    test('should generate different tokens for different users', () => {
      const userId1 = '507f1f77bcf86cd799439011';
      const userId2 = '507f1f77bcf86cd799439012';
      
      const token1 = authService.generateAccessToken(userId1);
      const token2 = authService.generateAccessToken(userId2);
      
      expect(token1).not.toBe(token2);
    });

    test('should generate different access and refresh tokens', () => {
      const userId = '507f1f77bcf86cd799439011';
      
      const accessToken = authService.generateAccessToken(userId);
      const refreshToken = authService.generateRefreshToken(userId);
      
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('Registration Data Validation', () => {
    test('should validate correct registration data through register function', async () => {
      const mockReq = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          password: 'password123'
        }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should reject short password through register function', async () => {
      const mockReq = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          password: '123'
        }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password must be at least 8 characters'
        })
      );
    });
  });

  describe('Existing User Check', () => {
    test('should detect existing email through register function', async () => {
      const user = await createTestUser();
      
      const mockReq = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: user.email,
          phone: '9999999999',
          password: 'password123'
        }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already registered'
        })
      );
    });

    test('should detect existing phone through register function', async () => {
      const user = await createTestUser();
      
      const mockReq = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'new@example.com',
          phone: user.phone,
          password: 'password123'
        }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Phone number already registered'
        })
      );
    });
  });

  describe('User Response Creation', () => {
    test('should create proper user response through register function', async () => {
      const mockReq = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          password: 'password123'
        }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890'
          })
        })
      );
    });

    test('should create proper chef response through register function', async () => {
      const mockReq = {
        body: {
          firstName: 'John',
          lastName: 'Chef',
          email: 'john.chef@example.com',
          phone: '1234567890',
          password: 'password123'
        }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authService.register(mockReq, mockRes, Chef, 'chef');

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cook: expect.objectContaining({
            firstName: 'John',
            lastName: 'Chef',
            email: 'john.chef@example.com',
            phone: '1234567890'
          })
        })
      );
    });
  });

  describe('Registration Function', () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          password: 'password123'
        }
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should register new user successfully', async () => {
      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
          user: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890'
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    test('should register new chef successfully', async () => {
      await authService.register(mockReq, mockRes, Chef, 'chef');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cook registered successfully',
          cook: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890'
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    test('should reject registration with invalid data', async () => {
      mockReq.body.password = '123';

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password must be at least 8 characters'
        })
      );
    });

    test('should reject registration with existing email', async () => {
      await createTestUser({ email: 'john.doe@example.com' });

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already registered'
        })
      );
    });

    test('should reject registration with existing phone', async () => {
      await createTestUser({ phone: '1234567890' });

      await authService.register(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Phone number already registered'
        })
      );
    });
  });

  describe('Login Function', () => {
    let mockReq, mockRes, user;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'john.doe@example.com',
        password: 'password123'
      });

      mockReq = {
        body: {
          email: 'john.doe@example.com',
          password: 'password123'
        }
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should login user successfully', async () => {
      await authService.login(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: expect.objectContaining({
            email: 'john.doe@example.com'
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    test('should login chef successfully', async () => {
      const chef = await createTestChef({
        email: 'chef@example.com',
        password: 'password123'
      });

      mockReq.body.email = 'chef@example.com';

      await authService.login(mockReq, mockRes, Chef, 'chef');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          cook: expect.objectContaining({
            email: 'chef@example.com'
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    test('should reject login with missing email', async () => {
      mockReq.body.email = undefined;

      await authService.login(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email and password are required'
        })
      );
    });

    test('should reject login with missing password', async () => {
      mockReq.body.password = undefined;

      await authService.login(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email and password are required'
        })
      );
    });

    test('should reject login with non-existing user', async () => {
      mockReq.body.email = 'nonexistent@example.com';

      await authService.login(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password'
        })
      );
    });

    test('should reject login with wrong password', async () => {
      mockReq.body.password = 'wrongpassword';

      await authService.login(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password'
        })
      );
    });

    test('should reject login with inactive account', async () => {
      user.accountStatus = 'inactive';
      await user.save();

      await authService.login(mockReq, mockRes, User, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account is not active'
        })
      );
    });
  });

  describe('Logout Function', () => {
    let mockReq, mockRes, user;

    beforeEach(async () => {
      user = await createTestUser();
      const refreshToken = authService.generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save();

      mockReq = {
        body: {
          refreshToken: refreshToken
        }
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should logout user successfully', async () => {
      await authService.logout(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Logout successful'
        })
      );

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBeNull();
    });

    test('should handle logout without refresh token', async () => {
      mockReq.body.refreshToken = undefined;

      await authService.logout(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Refresh token required'
        })
      );
    });

    test('should handle logout with invalid refresh token', async () => {
      mockReq.body.refreshToken = 'invalid-token';

      await authService.logout(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Logout successful'
        })
      );
    });
  });

  describe('Me Function', () => {
    let mockReq, mockRes, user;

    beforeEach(async () => {
      user = await createTestUser();

      mockReq = {
        user: user
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should return user data', async () => {
      await authService.me(mockReq, mockRes, 'user');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.user.id.toString()).toBe(user._id.toString());
      expect(response.user.firstName).toBe(user.firstName);
      expect(response.user.lastName).toBe(user.lastName);
      expect(response.user.email).toBe(user.email);
    });

    test('should return chef data', async () => {
      const chef = await createTestChef();
      mockReq.user = chef;

      await authService.me(mockReq, mockRes, 'chef');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.cook.id.toString()).toBe(chef._id.toString());
      expect(response.cook.firstName).toBe(chef.firstName);
      expect(response.cook.lastName).toBe(chef.lastName);
      expect(response.cook.email).toBe(chef.email);
    });
  });

  describe('Refresh Token Function', () => {
    let mockReq, mockRes, user;

    beforeEach(async () => {
      user = await createTestUser();
      const refreshToken = authService.generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save();

      mockReq = {
        body: {
          refreshToken: refreshToken
        }
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should refresh tokens successfully', async () => {
      await authService.refreshToken(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.message).toBe('Token refreshed successfully');
      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBe(response.refreshToken);
    });

    test('should reject refresh without token', async () => {
      mockReq.body.refreshToken = undefined;

      await authService.refreshToken(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Refresh token required'
        })
      );
    });

    test('should reject refresh with invalid token', async () => {
      mockReq.body.refreshToken = 'invalid-token';

      await authService.refreshToken(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid refresh token'
        })
      );
    });

    test('should reject refresh with inactive account', async () => {
      user.accountStatus = 'inactive';
      await user.save();

      await authService.refreshToken(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account is not active'
        })
      );
    });
  });

  describe('Change Password Function', () => {
    let mockReq, mockRes, user;

    beforeEach(async () => {
      user = await createTestUser({
        password: 'oldpassword123'
      });

      mockReq = {
        user: user,
        body: {
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123'
        }
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should change password successfully', async () => {
      await authService.changePassword(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password changed successfully. Please login again.'
        })
      );

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBeNull();
    });

    test('should reject change password without current password', async () => {
      mockReq.body.currentPassword = undefined;

      await authService.changePassword(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Current password and new password are required'
        })
      );
    });

    test('should reject change password without new password', async () => {
      mockReq.body.newPassword = undefined;

      await authService.changePassword(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Current password and new password are required'
        })
      );
    });

    test('should reject short new password', async () => {
      mockReq.body.newPassword = '123';

      await authService.changePassword(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'New password must be at least 8 characters'
        })
      );
    });

    test('should reject wrong current password', async () => {
      mockReq.body.currentPassword = 'wrongpassword';

      await authService.changePassword(mockReq, mockRes, User);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Current password is incorrect'
        })
      );
    });
  });
});
