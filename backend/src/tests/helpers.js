const User = require('../models/user');
const Chef = require('../models/Chef');
const Order = require('../models/order');
const Assignment = require('../models/Assignment');
const Admin = require('../models/Admin');
const Review = require('../models/Review');
const jwt = require('jsonwebtoken');

const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    phone: '1234567890',
    password: 'password123',
    accountStatus: 'active',
    emailVerified: true,
    phoneVerified: true,
    preferences: {
      cuisines: ['Indian', 'Chinese'],
      dietaryType: 'Veg',
      allergies: [],
      notificationsEnabled: true,
      language: 'English',
      accessibility: false,
      privacyAccepted: true
    },
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    },
    householdSize: 2
  };

  const userData = { ...defaultUser, ...overrides };
  const user = new User(userData);
  await user.save();
  return user;
};

const createTestChef = async (overrides = {}) => {
  const defaultChef = {
    firstName: 'Test',
    lastName: 'Chef',
    email: 'testchef@example.com',
    phone: '0987654321',
    password: 'password123',
    accountStatus: 'active',
    cuisineSpecialty: ['Indian', 'Italian'],
    rating: 4.5,
    isAvailable: true,
    availability: {
      schedule: [
        {
          day: 'Monday',
          slots: [
            { startTime: '09:00', endTime: '12:00', isBooked: false },
            { startTime: '14:00', endTime: '18:00', isBooked: false }
          ]
        }
      ],
      unavailableDates: []
    },
    serviceAreas: [
      {
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        radius: 10
      }
    ]
  };

  const chefData = { ...defaultChef, ...overrides };
  const chef = new Chef(chefData);
  await chef.save();
  return chef;
};

const createTestAdmin = async (overrides = {}) => {
  const defaultAdmin = {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'testadmin@example.com',
    phone: '1122334455',
    password: 'password123',
    role: 'super_admin',
    permissions: {
      userManagement: true,
      chefManagement: true,
      assignmentManagement: true,
      orderManagement: true,
      analyticsAccess: true
    },
    accountStatus: 'active'
  };

  const adminData = { ...defaultAdmin, ...overrides };
  const admin = new Admin(adminData);
  await admin.save();
  return admin;
};

const createTestOrder = async (user, chef = null, assignment = null, overrides = {}) => {
  const defaultOrder = {
    user: user._id,
    chef: chef ? chef._id : null,
    assignment: assignment ? assignment._id : null,
    foodName: 'Test Meal',
    description: 'A delicious test meal',
    quantity: 2,
    numberOfPersons: 2,
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    scheduledTime: '12:00',
    specialInstructions: 'No spicy food',
    deliveryAddress: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    },
    estimatedPrice: 150,
    actualPrice: 150,
    status: 'new',
    orderType: 'individual',
    preparationTime: {
      estimatedMinutes: 30
    },
    deliveryTime: {
      estimatedMinutes: 15
    }
  };

  const orderData = { ...defaultOrder, ...overrides };
  const order = new Order(orderData);
  await order.save();
  return order;
};

const createTestAssignment = async (user, chef, admin, overrides = {}) => {
  const defaultAssignment = {
    user: user._id,
    chef: chef._id,
    assignedBy: admin._id,
    assignmentType: 'individual',
    status: 'active',
    startDate: new Date(),
    notes: 'Test assignment'
  };

  const assignmentData = { ...defaultAssignment, ...overrides };
  const assignment = new Assignment(assignmentData);
  await assignment.save();
  return assignment;
};

const createTestReview = async (user, order, overrides = {}) => {
  const defaultReview = {
    user: user._id,
    order: order._id,
    chef: order.chef,
    rating: 5,
    comment: 'Excellent food and service!',
    isVerified: true
  };

  const reviewData = { ...defaultReview, ...overrides };
  const review = new Review(reviewData);
  await review.save();
  return review;
};

const generateTestToken = (userId, userType = 'user') => {
  return jwt.sign({ userId, userType }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '1h'
  });
};

const generateTestRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d'
  });
};

const createAuthenticatedRequest = (user, userType = 'user') => {
  const token = generateTestToken(user._id, userType);
  return {
    headers: {
      authorization: `Bearer ${token}`
    },
    user: user
  };
};

const createTestData = async () => {
  const user = await createTestUser();
  const chef = await createTestChef();
  const admin = await createTestAdmin();
  const assignment = await createTestAssignment(user, chef, admin);
  const order = await createTestOrder(user, chef, assignment);
  
  return {
    user,
    chef,
    admin,
    assignment,
    order
  };
};

const cleanupTestData = async () => {
  await User.deleteMany({});
  await Chef.deleteMany({});
  await Admin.deleteMany({});
  await Order.deleteMany({});
  await Assignment.deleteMany({});
  await Review.deleteMany({});
};

const expectValidUserResponse = (userResponse, expectedUser) => {
  expect(userResponse).toHaveProperty('id');
  expect(userResponse).toHaveProperty('firstName', expectedUser.firstName);
  expect(userResponse).toHaveProperty('lastName', expectedUser.lastName);
  expect(userResponse).toHaveProperty('email', expectedUser.email);
  expect(userResponse).toHaveProperty('phone', expectedUser.phone);
  expect(userResponse).toHaveProperty('accountStatus', expectedUser.accountStatus);
  expect(userResponse).not.toHaveProperty('password');
  expect(userResponse).not.toHaveProperty('refreshToken');
};

const expectValidChefResponse = (chefResponse, expectedChef) => {
  expect(chefResponse).toHaveProperty('id');
  expect(chefResponse).toHaveProperty('firstName', expectedChef.firstName);
  expect(chefResponse).toHaveProperty('lastName', expectedChef.lastName);
  expect(chefResponse).toHaveProperty('email', expectedChef.email);
  expect(chefResponse).toHaveProperty('phone', expectedChef.phone);
  expect(chefResponse).toHaveProperty('cuisineSpecialty');
  expect(chefResponse).toHaveProperty('rating');
  expect(chefResponse).toHaveProperty('isAvailable');
  expect(chefResponse).not.toHaveProperty('password');
  expect(chefResponse).not.toHaveProperty('refreshToken');
};

const expectValidOrderResponse = (orderResponse, expectedOrder) => {
  expect(orderResponse).toHaveProperty('id');
  expect(orderResponse).toHaveProperty('foodName', expectedOrder.foodName);
  expect(orderResponse).toHaveProperty('quantity', expectedOrder.quantity);
  expect(orderResponse).toHaveProperty('status', expectedOrder.status);
  expect(orderResponse).toHaveProperty('orderType', expectedOrder.orderType);
  expect(orderResponse).toHaveProperty('user');
  expect(orderResponse).toHaveProperty('createdAt');
};

const expectValidAssignmentResponse = (assignmentResponse, expectedAssignment) => {
  expect(assignmentResponse).toHaveProperty('id');
  expect(assignmentResponse).toHaveProperty('user');
  expect(assignmentResponse).toHaveProperty('chef');
  expect(assignmentResponse).toHaveProperty('assignedBy');
  expect(assignmentResponse).toHaveProperty('assignmentType', expectedAssignment.assignmentType);
  expect(assignmentResponse).toHaveProperty('status', expectedAssignment.status);
  expect(assignmentResponse).toHaveProperty('startDate');
};

const expectErrorResponse = (response, expectedStatus, expectedMessage) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('message');
  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
};

const expectSuccessResponse = (response, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('message');
};

module.exports = {
  createTestUser,
  createTestChef,
  createTestAdmin,
  createTestOrder,
  createTestAssignment,
  createTestReview,
  generateTestToken,
  generateTestRefreshToken,
  createAuthenticatedRequest,
  createTestData,
  cleanupTestData,
  expectValidUserResponse,
  expectValidChefResponse,
  expectValidOrderResponse,
  expectValidAssignmentResponse,
  expectErrorResponse,
  expectSuccessResponse
};
