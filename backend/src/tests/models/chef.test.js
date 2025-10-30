const Chef = require('../../models/Chef');
const {
  createTestChef,
  cleanupTestData
} = require('../helpers');

describe('Chef Model', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Chef Creation and Validation', () => {
    test('should create a chef with valid data', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef._id).toBeDefined();
      expect(chef.firstName).toBe('John');
      expect(chef.lastName).toBe('Chef');
      expect(chef.email).toBe('john.chef@example.com');
      expect(chef.phone).toBe('1234567890');
      expect(chef.password).toBeDefined();
      expect(chef.password).not.toBe('password123');
      expect(chef.accountStatus).toBe('active');
      expect(chef.rating).toBe(0);
      expect(chef.isAvailable).toBe(true);
    });

    test('should require firstName', async () => {
      const chefData = {
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });

    test('should require lastName', async () => {
      const chefData = {
        firstName: 'John',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });

    test('should require email', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });

    test('should require phone', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });

    test('should require password', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890'
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const chefData1 = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chefData2 = {
        firstName: 'Jane',
        lastName: 'Cook',
        email: 'john.chef@example.com',
        phone: '0987654321',
        password: 'password123'
      };

      const chef1 = new Chef(chefData1);
      await chef1.save();

      const chef2 = new Chef(chefData2);
      await expect(chef2.save()).rejects.toThrow();
    });

    test('should enforce unique phone', async () => {
      const chefData1 = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chefData2 = {
        firstName: 'Jane',
        lastName: 'Cook',
        email: 'jane.cook@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef1 = new Chef(chefData1);
      await chef1.save();

      const chef2 = new Chef(chefData2);
      await expect(chef2.save()).rejects.toThrow();
    });

    test('should normalize email to lowercase', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'JOHN.CHEF@EXAMPLE.COM',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.email).toBe('john.chef@example.com');
    });

    test('should trim whitespace from names and email', async () => {
      const chefData = {
        firstName: '  John  ',
        lastName: '  Chef  ',
        email: '  john.chef@example.com  ',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.firstName).toBe('John');
      expect(chef.lastName).toBe('Chef');
      expect(chef.email).toBe('john.chef@example.com');
    });
  });

  describe('Password Handling', () => {
    test('should hash password before saving', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.password).toBeDefined();
      expect(chef.password).not.toBe('password123');
      expect(chef.password.length).toBeGreaterThan(50);
    });

    test('should not hash password if not modified', async () => {
      const chef = await createTestChef();
      const originalPassword = chef.password;

      chef.firstName = 'Updated Name';
      await chef.save();

      expect(chef.password).toBe(originalPassword);
    });

    test('should compare password correctly', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      const isMatch = await chef.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await chef.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Cuisine Specialty', () => {
    test('should allow empty cuisine specialty array', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.cuisineSpecialty).toEqual([]);
    });

    test('should save cuisine specialties', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        cuisineSpecialty: ['Indian', 'Chinese', 'Italian']
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.cuisineSpecialty).toEqual(['Indian', 'Chinese', 'Italian']);
    });
  });

  describe('Rating System', () => {
    test('should set default rating to 0', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.rating).toBe(0);
    });

    test('should enforce minimum rating', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        rating: -1
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });

    test('should enforce maximum rating', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        rating: 6
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });

    test('should allow valid ratings', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        rating: 4.5
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.rating).toBe(4.5);
    });
  });

  describe('Availability', () => {
    test('should set default availability to true', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.isAvailable).toBe(true);
    });

    test('should allow setting availability to false', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        isAvailable: false
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.isAvailable).toBe(false);
    });
  });

  describe('Availability Schedule', () => {
    test('should initialize empty availability schedule', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.availability.schedule).toEqual([]);
      expect(chef.availability.unavailableDates).toEqual([]);
    });

    test('should save availability schedule', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        availability: {
          schedule: [
            {
              day: 'Monday',
              slots: [
                { startTime: '09:00', endTime: '12:00', isBooked: false },
                { startTime: '14:00', endTime: '18:00', isBooked: false }
              ]
            },
            {
              day: 'Tuesday',
              slots: [
                { startTime: '10:00', endTime: '14:00', isBooked: false }
              ]
            }
          ],
          unavailableDates: [
            {
              startDate: new Date('2024-12-25'),
              endDate: new Date('2024-12-25'),
              reason: 'Holiday'
            }
          ]
        }
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.availability.schedule).toHaveLength(2);
      expect(chef.availability.schedule[0].day).toBe('Monday');
      expect(chef.availability.schedule[0].slots).toHaveLength(2);
      expect(chef.availability.unavailableDates).toHaveLength(1);
      expect(chef.availability.unavailableDates[0].reason).toBe('Holiday');
    });

    test('should validate day enum in schedule', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        availability: {
          schedule: [
            {
              day: 'InvalidDay',
              slots: [
                { startTime: '09:00', endTime: '12:00', isBooked: false }
              ]
            }
          ]
        }
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });
  });

  describe('Service Areas', () => {
    test('should initialize empty service areas', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.serviceAreas).toEqual([]);
    });

    test('should save service areas', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        serviceAreas: [
          {
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            radius: 10
          },
          {
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            radius: 15
          }
        ]
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.serviceAreas).toHaveLength(2);
      expect(chef.serviceAreas[0].city).toBe('Mumbai');
      expect(chef.serviceAreas[0].radius).toBe(10);
      expect(chef.serviceAreas[1].city).toBe('Delhi');
      expect(chef.serviceAreas[1].radius).toBe(15);
    });
  });

  describe('Account Status', () => {
    test('should set default account status to active', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.accountStatus).toBe('active');
    });

    test('should allow different account statuses', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        accountStatus: 'suspended'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.accountStatus).toBe('suspended');
    });

    test('should reject invalid account status', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        accountStatus: 'invalid_status'
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow();
    });
  });

  describe('Assignments and Notifications', () => {
    test('should initialize empty assignments array', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.assignments).toEqual([]);
    });

    test('should initialize empty notifications array', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.notifications).toEqual([]);
    });

    test('should allow adding notifications', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      chef.notifications.push({
        message: 'New order assigned!',
        type: 'order_assigned',
        isRead: false
      });

      await chef.save();

      expect(chef.notifications).toHaveLength(1);
      expect(chef.notifications[0].message).toBe('New order assigned!');
      expect(chef.notifications[0].type).toBe('order_assigned');
      expect(chef.notifications[0].isRead).toBe(false);
      expect(chef.notifications[0].createdAt).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should set createdAt and updatedAt timestamps', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.createdAt).toBeDefined();
      expect(chef.updatedAt).toBeDefined();
      expect(chef.createdAt).toBeInstanceOf(Date);
      expect(chef.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      const originalUpdatedAt = chef.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      chef.firstName = 'Updated Name';
      await chef.save();

      expect(chef.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Profile Image', () => {
    test('should set default empty profile image', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.profileImage).toBe('');
    });

    test('should save profile image URL', async () => {
      const chefData = {
        firstName: 'John',
        lastName: 'Chef',
        email: 'john.chef@example.com',
        phone: '1234567890',
        password: 'password123',
        profileImage: 'https://example.com/profile.jpg'
      };

      const chef = new Chef(chefData);
      await chef.save();

      expect(chef.profileImage).toBe('https://example.com/profile.jpg');
    });
  });
});
