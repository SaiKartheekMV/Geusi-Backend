const Assignment = require('../../models/Assignment');
const User = require('../../models/user');
const Chef = require('../../models/Chef');
const Admin = require('../../models/Admin');
const {
  createTestUser,
  createTestChef,
  createTestAdmin,
  createTestAssignment,
  cleanupTestData
} = require('../helpers');

describe('Assignment Model', () => {
  let user, chef, admin;

  beforeEach(async () => {
    await cleanupTestData();
    user = await createTestUser();
    chef = await createTestChef();
    admin = await createTestAdmin();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Assignment Creation and Validation', () => {
    test('should create an assignment with valid data', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual',
        status: 'active',
        startDate: new Date(),
        notes: 'Test assignment'
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment._id).toBeDefined();
      expect(assignment.user.toString()).toBe(user._id.toString());
      expect(assignment.chef.toString()).toBe(chef._id.toString());
      expect(assignment.assignedBy.toString()).toBe(admin._id.toString());
      expect(assignment.assignmentType).toBe('individual');
      expect(assignment.status).toBe('active');
      expect(assignment.notes).toBe('Test assignment');
    });

    test('should require user', async () => {
      const assignmentData = {
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });

    test('should require chef', async () => {
      const assignmentData = {
        user: user._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });

    test('should require assignedBy', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });

    test('should set default assignmentType to individual', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.assignmentType).toBe('individual');
    });

    test('should set default status to active', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.status).toBe('active');
    });

    test('should set default startDate to current date', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.startDate).toBeDefined();
      expect(assignment.startDate).toBeInstanceOf(Date);
      expect(assignment.startDate.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should set default order statistics', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.totalOrders).toBe(0);
      expect(assignment.totalAmount).toBe(0);
      expect(assignment.lastOrderDate).toBeUndefined();
    });
  });

  describe('Assignment Type Validation', () => {
    test('should accept valid assignment types', async () => {
      const validTypes = ['individual', 'subscription'];
      
      for (const assignmentType of validTypes) {
        const assignmentData = {
          user: user._id,
          chef: chef._id,
          assignedBy: admin._id,
          assignmentType: assignmentType,
          ...(assignmentType === 'subscription' && {
            subscriptionDetails: {
              planType: 'weekly'
            }
          })
        };

        const assignment = new Assignment(assignmentData);
        await assignment.save();
        expect(assignment.assignmentType).toBe(assignmentType);
        await Assignment.findByIdAndDelete(assignment._id);
      }
    });

    test('should reject invalid assignment type', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'invalid_type'
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    test('should accept valid status values', async () => {
      const validStatuses = ['active', 'inactive', 'suspended', 'completed'];
      
      for (const status of validStatuses) {
        const assignmentData = {
          user: user._id,
          chef: chef._id,
          assignedBy: admin._id,
          assignmentType: 'individual',
          status: status
        };

        const assignment = new Assignment(assignmentData);
        await assignment.save();
        expect(assignment.status).toBe(status);
        await Assignment.findByIdAndDelete(assignment._id);
      }
    });

    test('should reject invalid status', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual',
        status: 'invalid_status'
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Subscription Details', () => {
    test('should save subscription details for subscription assignment', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'subscription',
        subscriptionDetails: {
          planType: 'weekly',
          mealsPerWeek: 5,
          deliveryDays: ['monday', 'wednesday', 'friday'],
          mealPreferences: {
            cuisines: ['Indian', 'Chinese'],
            dietaryRestrictions: ['Vegetarian'],
            allergies: ['Nuts']
          }
        }
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.subscriptionDetails.planType).toBe('weekly');
      expect(assignment.subscriptionDetails.mealsPerWeek).toBe(5);
      expect(assignment.subscriptionDetails.deliveryDays).toEqual(['monday', 'wednesday', 'friday']);
      expect(assignment.subscriptionDetails.mealPreferences.cuisines).toEqual(['Indian', 'Chinese']);
      expect(assignment.subscriptionDetails.mealPreferences.dietaryRestrictions).toEqual(['Vegetarian']);
      expect(assignment.subscriptionDetails.mealPreferences.allergies).toEqual(['Nuts']);
    });

    test('should validate plan type enum', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'subscription',
        subscriptionDetails: {
          planType: 'invalid_plan'
        }
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });

    test('should validate meals per week range', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'subscription',
        subscriptionDetails: {
          planType: 'weekly',
          mealsPerWeek: 25
        }
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });

    test('should validate delivery days enum', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'subscription',
        subscriptionDetails: {
          planType: 'weekly',
          deliveryDays: ['invalid_day']
        }
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });

    test('should require plan type for subscription assignments', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'subscription',
        subscriptionDetails: {
          mealsPerWeek: 5
        }
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Rating and Feedback', () => {
    test('should save rating and feedback', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual',
        rating: 4.5,
        feedback: 'Excellent service and food quality!'
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.rating).toBe(4.5);
      expect(assignment.feedback).toBe('Excellent service and food quality!');
    });

    test('should validate rating range', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual',
        rating: 6
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });

    test('should validate feedback length', async () => {
      const longFeedback = 'a'.repeat(1001);
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual',
        feedback: longFeedback
      };

      const assignment = new Assignment(assignmentData);
      await expect(assignment.save()).rejects.toThrow();
    });
  });

  describe('Assignment Methods', () => {
    let assignment;

    beforeEach(async () => {
      assignment = await createTestAssignment(user, chef, admin);
    });

    test('should check if assignment is active', async () => {
      expect(assignment.isActive()).toBe(true);

      assignment.status = 'inactive';
      expect(assignment.isActive()).toBe(false);

      assignment.status = 'active';
      assignment.endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(assignment.isActive()).toBe(false);
    });

    test('should check if assignment can receive orders', async () => {
      expect(assignment.isActive()).toBe(true);

      assignment.status = 'inactive';
      expect(assignment.isActive()).toBe(false);

      assignment.status = 'active';
      chef.isAvailable = false;
      await chef.save();
      
      const populatedAssignment = await Assignment.findById(assignment._id).populate('chef');
      expect(populatedAssignment.canReceiveOrders()).toBe(false);
    });

    test('should update order statistics', async () => {
      const initialOrders = assignment.totalOrders;
      const initialAmount = assignment.totalAmount;
      const orderAmount = 150;

      await assignment.updateOrderStats(orderAmount);

      expect(assignment.totalOrders).toBe(initialOrders + 1);
      expect(assignment.totalAmount).toBe(initialAmount + orderAmount);
      expect(assignment.lastOrderDate).toBeDefined();
      expect(assignment.lastOrderDate).toBeInstanceOf(Date);
    });

    test('should update order statistics multiple times', async () => {
      await assignment.updateOrderStats(100);
      await assignment.updateOrderStats(200);
      await assignment.updateOrderStats(150);

      expect(assignment.totalOrders).toBe(3);
      expect(assignment.totalAmount).toBe(450);
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce unique user-chef combination', async () => {
      const assignmentData1 = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignmentData2 = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'subscription'
      };

      const assignment1 = new Assignment(assignmentData1);
      await assignment1.save();

      const assignment2 = new Assignment(assignmentData2);
      await expect(assignment2.save()).rejects.toThrow();
    });

    test('should allow same user with different chefs', async () => {
      const chef2 = await createTestChef({ email: 'chef2@example.com', phone: '1111111111' });

      const assignmentData1 = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignmentData2 = {
        user: user._id,
        chef: chef2._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment1 = new Assignment(assignmentData1);
      await assignment1.save();

      const assignment2 = new Assignment(assignmentData2);
      await assignment2.save();

      expect(assignment1._id).toBeDefined();
      expect(assignment2._id).toBeDefined();
    });

    test('should allow same chef with different users', async () => {
      const user2 = await createTestUser({ email: 'user2@example.com', phone: '2222222222' });

      const assignmentData1 = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignmentData2 = {
        user: user2._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment1 = new Assignment(assignmentData1);
      await assignment1.save();

      const assignment2 = new Assignment(assignmentData2);
      await assignment2.save();

      expect(assignment1._id).toBeDefined();
      expect(assignment2._id).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should set createdAt and updatedAt timestamps', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.createdAt).toBeDefined();
      expect(assignment.updatedAt).toBeDefined();
      expect(assignment.createdAt).toBeInstanceOf(Date);
      expect(assignment.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual'
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      const originalUpdatedAt = assignment.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      assignment.notes = 'Updated notes';
      await assignment.save();

      expect(assignment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Database Indexes', () => {
    test('should have proper indexes for efficient queries', async () => {
      const indexes = await Assignment.collection.getIndexes();
      
      expect(indexes).toBeDefined();
      expect(Object.keys(indexes).length).toBeGreaterThan(1);
    });
  });

  describe('End Date Handling', () => {
    test('should allow setting end date', async () => {
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual',
        endDate: endDate
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.endDate).toEqual(endDate);
    });

    test('should allow null end date', async () => {
      const assignmentData = {
        user: user._id,
        chef: chef._id,
        assignedBy: admin._id,
        assignmentType: 'individual',
        endDate: null
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      expect(assignment.endDate).toBeNull();
    });
  });
});
