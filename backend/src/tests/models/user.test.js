const User = require('../../models/user');
const {
  createTestUser,
  cleanupTestData
} = require('../helpers');

describe('User Model', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('User Creation and Validation', () => {
    test('should create a user with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.phone).toBe('1234567890');
      expect(user.password).toBeDefined();
      expect(user.password).not.toBe('password123');
      expect(user.accountStatus).toBe('active');
      expect(user.emailVerified).toBe(false);
      expect(user.phoneVerified).toBe(false);
    });

    test('should require firstName', async () => {
      const userData = {
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require phone', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john.doe@example.com',
        phone: '0987654321',
        password: 'password123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should enforce unique phone', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should normalize email to lowercase', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN.DOE@EXAMPLE.COM',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.email).toBe('john.doe@example.com');
    });

    test('should trim whitespace from names and email', async () => {
      const userData = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  john.doe@example.com  ',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john.doe@example.com');
    });
  });

  describe('Password Handling', () => {
    test('should hash password before saving', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(50);
    });

    test('should not hash password if not modified', async () => {
      const user = await createTestUser();
      const originalPassword = user.password;

      user.firstName = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });

    test('should compare password correctly', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Address Validation', () => {
    test('should require address fields when any address field is provided', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        address: {
          street: '123 Main St'
        }
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should allow empty address', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.address).toEqual({});
    });

    test('should save complete address', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        }
      };

      const user = new User(userData);
      await user.save();

      expect(user.address.street).toBe('123 Main St');
      expect(user.address.city).toBe('Test City');
      expect(user.address.state).toBe('Test State');
      expect(user.address.pincode).toBe('123456');
    });
  });

  describe('Preferences and Subscription', () => {
    test('should set default preferences', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.preferences.dietaryType).toBe('Veg');
      expect(user.preferences.notificationsEnabled).toBe(true);
      expect(user.preferences.language).toBe('English');
      expect(user.preferences.accessibility).toBe(false);
      expect(user.preferences.privacyAccepted).toBe(false);
    });

    test('should set default subscription', async () => {
      const user = await createTestUser();

      expect(user.subscription.plan).toBe('None');
      expect(user.subscription.isActive).toBe(false);
    });

    test('should allow custom preferences', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        preferences: {
          cuisines: ['Indian', 'Chinese'],
          dietaryType: 'Non-Veg',
          allergies: ['Nuts'],
          notificationsEnabled: false,
          language: 'Hindi',
          accessibility: true,
          privacyAccepted: true
        }
      };

      const user = new User(userData);
      await user.save();

      expect(user.preferences.cuisines).toEqual(['Indian', 'Chinese']);
      expect(user.preferences.dietaryType).toBe('Non-Veg');
      expect(user.preferences.allergies).toEqual(['Nuts']);
      expect(user.preferences.notificationsEnabled).toBe(false);
      expect(user.preferences.language).toBe('Hindi');
      expect(user.preferences.accessibility).toBe(true);
      expect(user.preferences.privacyAccepted).toBe(true);
    });
  });

  describe('Account Status', () => {
    test('should set default account status to active', async () => {
      const user = await createTestUser();
      expect(user.accountStatus).toBe('active');
    });

    test('should allow different account statuses', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        accountStatus: 'suspended'
      };

      const user = new User(userData);
      await user.save();

      expect(user.accountStatus).toBe('suspended');
    });

    test('should reject invalid account status', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        accountStatus: 'invalid_status'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    test('should set createdAt and updatedAt timestamps', async () => {
      const user = await createTestUser();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const user = await createTestUser();
      const originalUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      user.firstName = 'Updated Name';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Notifications Array', () => {
    test('should initialize empty notifications array', async () => {
      const user = await createTestUser();
      expect(user.notifications).toEqual([]);
    });

    test('should allow adding notifications', async () => {
      const user = await createTestUser();
      
      user.notifications.push({
        message: 'Welcome to Geusi!',
        type: 'welcome',
        isRead: false
      });

      await user.save();

      expect(user.notifications).toHaveLength(1);
      expect(user.notifications[0].message).toBe('Welcome to Geusi!');
      expect(user.notifications[0].type).toBe('welcome');
      expect(user.notifications[0].isRead).toBe(false);
      expect(user.notifications[0].createdAt).toBeDefined();
    });
  });

  describe('Household Size', () => {
    test('should set default household size to 1', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.householdSize).toBe(1);
    });

    test('should enforce minimum household size', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        householdSize: 0
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should allow custom household size', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        householdSize: 4
      };

      const user = new User(userData);
      await user.save();

      expect(user.householdSize).toBe(4);
    });
  });
});
