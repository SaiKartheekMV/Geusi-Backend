const {
  createTestUser,
  createTestChef,
  createTestAdmin,
  createTestOrder,
  createTestAssignment,
  createTestReview,
  generateTestToken,
  createTestData,
  cleanupTestData,
  expectValidUserResponse,
  expectValidChefResponse,
  expectValidOrderResponse,
  expectValidAssignmentResponse
} = require('./helpers');

describe('Test Helpers', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('User Creation', () => {
    test('should create a test user with default data', async () => {
      const user = await createTestUser();
      
      expect(user).toBeDefined();
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.email).toBe('testuser@example.com');
      expect(user.phone).toBe('1234567890');
      expect(user.accountStatus).toBe('active');
      expect(user.password).toBeDefined();
    });

    test('should create a test user with custom data', async () => {
      const customData = {
        firstName: 'Custom',
        lastName: 'User',
        email: 'custom@example.com',
        phone: '9999999999'
      };
      
      const user = await createTestUser(customData);
      
      expect(user.firstName).toBe('Custom');
      expect(user.lastName).toBe('User');
      expect(user.email).toBe('custom@example.com');
      expect(user.phone).toBe('9999999999');
    });
  });

  describe('Chef Creation', () => {
    test('should create a test chef with default data', async () => {
      const chef = await createTestChef();
      
      expect(chef).toBeDefined();
      expect(chef.firstName).toBe('Test');
      expect(chef.lastName).toBe('Chef');
      expect(chef.email).toBe('testchef@example.com');
      expect(chef.cuisineSpecialty).toEqual(['Indian', 'Italian']);
      expect(chef.rating).toBe(4.5);
      expect(chef.isAvailable).toBe(true);
    });
  });

  describe('Admin Creation', () => {
    test('should create a test admin with default data', async () => {
      const admin = await createTestAdmin();
      
      expect(admin).toBeDefined();
      expect(admin.firstName).toBe('Test');
      expect(admin.lastName).toBe('Admin');
      expect(admin.email).toBe('testadmin@example.com');
      expect(admin.role).toBe('super_admin');
      expect(admin.permissions.userManagement).toBe(true);
    });
  });

  describe('Order Creation', () => {
    test('should create a test order with user', async () => {
      const user = await createTestUser();
      const order = await createTestOrder(user);
      
      expect(order).toBeDefined();
      expect(order.user.toString()).toBe(user._id.toString());
      expect(order.foodName).toBe('Test Meal');
      expect(order.quantity).toBe(2);
      expect(order.status).toBe('new');
      expect(order.orderType).toBe('individual');
    });

    test('should create a test order with chef and assignment', async () => {
      const user = await createTestUser();
      const chef = await createTestChef();
      const admin = await createTestAdmin();
      const assignment = await createTestAssignment(user, chef, admin);
      const order = await createTestOrder(user, chef, assignment);
      
      expect(order.chef.toString()).toBe(chef._id.toString());
      expect(order.assignment.toString()).toBe(assignment._id.toString());
    });
  });

  describe('Assignment Creation', () => {
    test('should create a test assignment', async () => {
      const user = await createTestUser();
      const chef = await createTestChef();
      const admin = await createTestAdmin();
      const assignment = await createTestAssignment(user, chef, admin);
      
      expect(assignment).toBeDefined();
      expect(assignment.user.toString()).toBe(user._id.toString());
      expect(assignment.chef.toString()).toBe(chef._id.toString());
      expect(assignment.assignedBy.toString()).toBe(admin._id.toString());
      expect(assignment.assignmentType).toBe('individual');
      expect(assignment.status).toBe('active');
    });
  });

  describe('Token Generation', () => {
    test('should generate valid access token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateTestToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('Complete Test Data Creation', () => {
    test('should create complete test data set', async () => {
      const testData = await createTestData();
      
      expect(testData.user).toBeDefined();
      expect(testData.chef).toBeDefined();
      expect(testData.admin).toBeDefined();
      expect(testData.assignment).toBeDefined();
      expect(testData.order).toBeDefined();
      
      expect(testData.order.user.toString()).toBe(testData.user._id.toString());
      expect(testData.order.chef.toString()).toBe(testData.chef._id.toString());
      expect(testData.order.assignment.toString()).toBe(testData.assignment._id.toString());
    });
  });

  describe('Response Validation Helpers', () => {
    test('should validate user response format', async () => {
      const user = await createTestUser();
      const userResponse = {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        accountStatus: user.accountStatus
      };
      
      expectValidUserResponse(userResponse, user);
    });

    test('should validate chef response format', async () => {
      const chef = await createTestChef();
      const chefResponse = {
        id: chef._id.toString(),
        firstName: chef.firstName,
        lastName: chef.lastName,
        email: chef.email,
        phone: chef.phone,
        cuisineSpecialty: chef.cuisineSpecialty,
        rating: chef.rating,
        isAvailable: chef.isAvailable
      };
      
      expectValidChefResponse(chefResponse, chef);
    });
  });
});
