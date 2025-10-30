/**
 * @file tests/controllers/adminController.test.js
 */
const adminController = require('../../controllers/adminController');
const Admin = require('../../models/Admin');
const adminDashboardService = require('../../services/admin/adminDashboardService');
const authService = require('../../services/authService');
const {
  createTestAdmin,
  cleanupTestData
} = require('../helpers');
const { sendResponse, sendErrorResponse } = require('../../utils/controllerUtils');

jest.mock('../../utils/controllerUtils');
jest.mock('../../services/admin/adminDashboardService');
jest.mock('../../services/authService');

describe('Admin Controller', () => {

  afterEach(async () => {
    jest.clearAllMocks();
    await cleanupTestData();
  });

  // --------------------------------------------------------
  describe('login()', () => {
    test('should return 400 if email or password missing', async () => {
      const req = { body: {} };
      const res = {};
      await adminController.login(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, 'Email and password are required');
    });

    test('should return 401 if admin not found', async () => {
      const req = { body: { email: 'x@y.com', password: 'abc' } };
      const res = {};
      await adminController.login(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 401, 'Invalid email or password');
    });

    test('should return 401 if password mismatch', async () => {
      const admin = await createTestAdmin();
      admin.comparePassword = jest.fn().mockResolvedValue(false);
      jest.spyOn(Admin, 'findOne').mockResolvedValue(admin);

      const req = { body: { email: admin.email, password: 'wrongpass' } };
      const res = {};
      await adminController.login(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 401, 'Invalid email or password');
    });

    test('should login successfully', async () => {
      const admin = await createTestAdmin();
      admin.comparePassword = jest.fn().mockResolvedValue(true);
      admin.updateLastLogin = jest.fn();
      jest.spyOn(Admin, 'findOne').mockResolvedValue(admin);
      authService.generateAccessToken.mockReturnValue('access-token');
      authService.generateRefreshToken.mockReturnValue('refresh-token');

      const req = { body: { email: admin.email, password: 'password123' } };
      const res = {};
      await adminController.login(req, res);

      expect(authService.generateAccessToken).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        res,
        200,
        expect.objectContaining({
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }),
        'Login successful'
      );
    });
  });

  // --------------------------------------------------------
  describe('getDashboardStats()', () => {
    test('should return dashboard stats successfully', async () => {
      adminDashboardService.getDashboardStats.mockResolvedValue({ totalUsers: 5 });
      const req = {};
      const res = {};

      await adminController.getDashboardStats(req, res);
      expect(adminDashboardService.getDashboardStats).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        res,
        200,
        { stats: { totalUsers: 5 } },
        'Dashboard stats retrieved successfully'
      );
    });
  });

  // --------------------------------------------------------
  describe('getProcessedRequests()', () => {
    test('should reject invalid status', async () => {
      const req = { query: { status: 'pending' } };
      const res = {};
      await adminController.getProcessedRequests(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, "Status must be 'approved' or 'rejected'");
    });
  });

  // --------------------------------------------------------
  describe('approveRequest()', () => {
    test('should handle missing requestId', async () => {
      const req = { body: {} };
      const res = {};
      await adminController.approveRequest(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, 'Request ID is required');
    });
  });

  // --------------------------------------------------------
  describe('rejectRequest()', () => {
    test('should handle missing reason', async () => {
      const req = { body: { requestId: '123' } };
      const res = {};
      await adminController.rejectRequest(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, 'Rejection reason is required');
    });
  });

  // --------------------------------------------------------
  describe('assignChef()', () => {
    test('should handle missing fields', async () => {
      const req = { body: {} };
      const res = {};
      await adminController.assignChef(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, 'Order ID, Chef ID, and Admin ID are required');
    });
  });
});
