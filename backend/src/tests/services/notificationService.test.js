const notificationService = require('../../services/notificationService');

jest.mock('../../models/user');
jest.mock('../../models/Admin');
jest.mock('../../models/Chef');

const User = require('../../models/user');
const Admin = require('../../models/Admin');
const Chef = require('../../models/Chef');

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addNotificationToUser', () => {
    it('should be a function', () => {
      expect(typeof notificationService.addNotificationToUser).toBe('function');
    });

    it('should accept two parameters', () => {
      expect(notificationService.addNotificationToUser.length).toBe(2);
    });

    it('should add notification to user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const notificationData = {
        message: 'Test notification',
        type: 'info',
        meta: { orderId: '123' },
        sendEmail: false,
      };

      const result = await notificationService.addNotificationToUser('user123', notificationData);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Test notification');
      expect(result.data.type).toBe('info');
      expect(result.data.isRead).toBe(false);
      expect(result.data.meta).toEqual({ orderId: '123' });
      expect(mockUser.notifications).toHaveLength(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should add notification to chef successfully', async () => {
      const mockChef = {
        _id: 'chef123',
        firstName: 'Test',
        lastName: 'Chef',
        email: 'chef@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(null);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(mockChef);

      const notificationData = {
        message: 'Chef notification',
        type: 'success',
        meta: {},
        sendEmail: false,
      };

      const result = await notificationService.addNotificationToUser('chef123', notificationData);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Chef notification');
      expect(result.data.type).toBe('success');
      expect(mockChef.notifications).toHaveLength(1);
      expect(mockChef.save).toHaveBeenCalled();
    });

    it('should add notification to admin successfully', async () => {
      const mockAdmin = {
        _id: 'admin123',
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(null);
      Admin.findById.mockResolvedValue(mockAdmin);
      Chef.findById.mockResolvedValue(null);

      const notificationData = {
        message: 'Admin notification',
        type: 'warning',
        meta: {},
        sendEmail: false,
      };

      const result = await notificationService.addNotificationToUser('admin123', notificationData);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Admin notification');
      expect(result.data.type).toBe('warning');
      expect(mockAdmin.notifications).toHaveLength(1);
      expect(mockAdmin.save).toHaveBeenCalled();
    });

    it('should use default values for optional parameters', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.addNotificationToUser('user123', {
        message: 'Simple notification',
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Simple notification');
      expect(result.data.type).toBe('info');
      expect(result.data.isRead).toBe(false);
      expect(result.data.meta).toEqual({});
    });

    it('should throw error for non-existent user', async () => {
      User.findById.mockResolvedValue(null);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.addNotificationToUser('nonexistent', {
        message: 'Test notification',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(result.error).toBe('User not found');
    });

    it('should handle different notification types', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const types = ['info', 'success', 'warning', 'error'];
      
      for (const type of types) {
        const result = await notificationService.addNotificationToUser('user123', {
          message: `${type} notification`,
          type,
        });
        expect(result.success).toBe(true);
        expect(result.data.type).toBe(type);
      }
    });

    it('should handle complex meta data', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const complexMeta = {
        orderId: '123',
        amount: 50.00,
        items: ['item1', 'item2'],
        timestamp: new Date(),
      };

      const result = await notificationService.addNotificationToUser('user123', {
        message: 'Complex notification',
        meta: complexMeta,
      });

      expect(result.success).toBe(true);
      expect(result.data.meta).toEqual(complexMeta);
    });

    it('should handle empty meta data', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.addNotificationToUser('user123', {
        message: 'Empty meta notification',
        meta: {},
      });

      expect(result.success).toBe(true);
      expect(result.data.meta).toEqual({});
    });

    it('should handle null meta data', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.addNotificationToUser('user123', {
        message: 'Null meta notification',
        meta: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.meta).toEqual(null);
    });

    it('should handle sendEmail flag', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const mockSendMail = jest.fn().mockResolvedValue();
      const originalTransporter = require('nodemailer').createTransport;
      require('nodemailer').createTransport = jest.fn().mockReturnValue({
        sendMail: mockSendMail,
      });

      const result = await notificationService.addNotificationToUser('user123', {
        message: 'Email notification',
        sendEmail: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Email notification');
      expect(mockUser.save).toHaveBeenCalled();

      require('nodemailer').createTransport = originalTransporter;
    });

    it('should handle sendEmail false', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.addNotificationToUser('user123', {
        message: 'No email notification',
        sendEmail: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('No email notification');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('markNotificationRead', () => {
    it('should be a function', () => {
      expect(typeof notificationService.markNotificationRead).toBe('function');
    });

    it('should accept two parameters', () => {
      expect(notificationService.markNotificationRead.length).toBe(2);
    });

    it('should mark notification as read for user', async () => {
      const mockNotification = {
        _id: 'notification123',
        message: 'Test notification',
        isRead: false,
      };

      const mockUser = {
        _id: 'user123',
        notifications: {
          id: jest.fn().mockReturnValue(mockNotification),
        },
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.markNotificationRead('user123', 'notification123');

      expect(result.success).toBe(true);
      expect(result.data.isRead).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should mark notification as read for chef', async () => {
      const mockNotification = {
        _id: 'notification123',
        message: 'Chef notification',
        isRead: false,
      };

      const mockChef = {
        _id: 'chef123',
        notifications: {
          id: jest.fn().mockReturnValue(mockNotification),
        },
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(null);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(mockChef);

      const result = await notificationService.markNotificationRead('chef123', 'notification123');

      expect(result.success).toBe(true);
      expect(result.data.isRead).toBe(true);
      expect(mockChef.save).toHaveBeenCalled();
    });

    it('should mark notification as read for admin', async () => {
      const mockNotification = {
        _id: 'notification123',
        message: 'Admin notification',
        isRead: false,
      };

      const mockAdmin = {
        _id: 'admin123',
        notifications: {
          id: jest.fn().mockReturnValue(mockNotification),
        },
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(null);
      Admin.findById.mockResolvedValue(mockAdmin);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.markNotificationRead('admin123', 'notification123');

      expect(result.success).toBe(true);
      expect(result.data.isRead).toBe(true);
      expect(mockAdmin.save).toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      User.findById.mockResolvedValue(null);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.markNotificationRead('nonexistent', 'notification123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Notification not found');
      expect(result.error).toBe('Notification not found');
    });

    it('should throw error for non-existent notification', async () => {
      const mockUser = {
        _id: 'user123',
        notifications: {
          id: jest.fn().mockReturnValue(null),
        },
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.markNotificationRead('user123', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Notification not found');
      expect(result.error).toBe('Notification not found');
    });

    it('should handle already read notification', async () => {
      const mockNotification = {
        _id: 'notification123',
        message: 'Already read notification',
        isRead: true,
      };

      const mockUser = {
        _id: 'user123',
        notifications: {
          id: jest.fn().mockReturnValue(mockNotification),
        },
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.markNotificationRead('user123', 'notification123');

      expect(result.success).toBe(true);
      expect(result.data.isRead).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle invalid notification ID format', async () => {
      const mockUser = {
        _id: 'user123',
        notifications: {
          id: jest.fn().mockReturnValue(null),
        },
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const result = await notificationService.markNotificationRead('user123', 'invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Notification not found');
      expect(result.error).toBe('Notification not found');
    });

    it('should handle invalid user ID format', async () => {
      User.findById.mockRejectedValue(new Error('Cast to ObjectId failed'));
      Admin.findById.mockRejectedValue(new Error('Cast to ObjectId failed'));
      Chef.findById.mockRejectedValue(new Error('Cast to ObjectId failed'));

      const result = await notificationService.markNotificationRead('invalid-user-id', 'notification123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Notification not found');
      expect(result.error).toBe('Notification not found');
    });
  });

  describe('Notification Service Module', () => {
    it('should export addNotificationToUser function', () => {
      expect(notificationService.addNotificationToUser).toBeDefined();
      expect(typeof notificationService.addNotificationToUser).toBe('function');
    });

    it('should export markNotificationRead function', () => {
      expect(notificationService.markNotificationRead).toBeDefined();
      expect(typeof notificationService.markNotificationRead).toBe('function');
    });

    it('should not export other functions', () => {
      const exportedFunctions = Object.keys(notificationService);
      expect(exportedFunctions).toEqual(['addNotificationToUser', 'markNotificationRead']);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete notification workflow', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(mockUser);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      const addResult = await notificationService.addNotificationToUser('user123', {
        message: 'Workflow notification',
        type: 'info',
      });

      expect(addResult.success).toBe(true);
      expect(addResult.data.message).toBe('Workflow notification');
      expect(mockUser.notifications).toHaveLength(1);

      const mockNotification = {
        _id: 'notification123',
        message: 'Workflow notification',
        isRead: false,
      };

      mockUser.notifications.id = jest.fn().mockReturnValue(mockNotification);

      const markResult = await notificationService.markNotificationRead('user123', 'notification123');

      expect(markResult.success).toBe(true);
      expect(markResult.data.isRead).toBe(true);
    });

    it('should handle multiple users with notifications', async () => {
      const mockUser1 = {
        _id: 'user1',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      const mockUser2 = {
        _id: 'user2',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockResolvedValue(null);

      await notificationService.addNotificationToUser('user1', {
        message: 'User 1 notification',
      });

      await notificationService.addNotificationToUser('user2', {
        message: 'User 2 notification',
      });

      expect(mockUser1.notifications).toHaveLength(1);
      expect(mockUser2.notifications).toHaveLength(1);
    });

    it('should handle mixed user types with notifications', async () => {
      const mockUser = {
        _id: 'user123',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      const mockChef = {
        _id: 'chef123',
        notifications: [],
        save: jest.fn().mockResolvedValue(),
      };

      jest.clearAllMocks();
      
      User.findById.mockImplementation((id) => {
        if (id === 'user123') return Promise.resolve(mockUser);
        return Promise.resolve(null);
      });
      Admin.findById.mockResolvedValue(null);
      Chef.findById.mockImplementation((id) => {
        if (id === 'chef123') return Promise.resolve(mockChef);
        return Promise.resolve(null);
      });

      await notificationService.addNotificationToUser('user123', {
        message: 'User notification',
      });

      await notificationService.addNotificationToUser('chef123', {
        message: 'Chef notification',
      });

      expect(mockUser.notifications).toHaveLength(1);
      expect(mockChef.notifications).toHaveLength(1);
    });
  });
});