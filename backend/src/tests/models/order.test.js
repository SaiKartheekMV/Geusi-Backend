const Order = require('../../models/order');
const User = require('../../models/user');
const Chef = require('../../models/Chef');
const Assignment = require('../../models/Assignment');
const {
  createTestUser,
  createTestChef,
  createTestAdmin,
  createTestOrder,
  createTestAssignment,
  cleanupTestData
} = require('../helpers');

describe('Order Model', () => {
  let user, chef, admin, assignment;

  beforeEach(async () => {
    await cleanupTestData();
    user = await createTestUser();
    chef = await createTestChef();
    admin = await createTestAdmin();
    assignment = await createTestAssignment(user, chef, admin);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Order Creation and Validation', () => {
    test('should create an order with valid data', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        assignment: assignment._id,
        foodName: 'Chicken Biryani',
        description: 'Delicious chicken biryani with spices',
        quantity: 2,
        numberOfPersons: 2,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        scheduledTime: '12:00',
        specialInstructions: 'No spicy food',
        deliveryAddress: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        estimatedPrice: 200,
        actualPrice: 200,
        status: 'new',
        orderType: 'individual'
      };

      const order = new Order(orderData);
      await order.save();

      expect(order._id).toBeDefined();
      expect(order.user.toString()).toBe(user._id.toString());
      expect(order.chef.toString()).toBe(chef._id.toString());
      expect(order.assignment.toString()).toBe(assignment._id.toString());
      expect(order.foodName).toBe('Chicken Biryani');
      expect(order.description).toBe('Delicious chicken biryani with spices');
      expect(order.quantity).toBe(2);
      expect(order.numberOfPersons).toBe(2);
      expect(order.status).toBe('new');
      expect(order.orderType).toBe('individual');
    });

    test('should require user', async () => {
      const orderData = {
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should require foodName', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        quantity: 2
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should require quantity', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should enforce minimum quantity', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 0
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should set default numberOfPersons to 1', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.numberOfPersons).toBe(1);
    });

    test('should set default status to new', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.status).toBe('new');
    });

    test('should set default orderType to individual', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.orderType).toBe('individual');
    });
  });

  describe('Status Validation', () => {
    test('should accept valid status values', async () => {
      const validStatuses = ['new', 'confirmed', 'preparing', 'onTheWay', 'delivered', 'cancelled', 'rejected'];
      
      for (const status of validStatuses) {
        const orderData = {
          user: user._id,
          chef: chef._id,
          foodName: 'Chicken Biryani',
          quantity: 2,
          status: status
        };

        const order = new Order(orderData);
        await order.save();
        expect(order.status).toBe(status);
        await Order.findByIdAndDelete(order._id);
      }
    });

    test('should reject invalid status', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        status: 'invalid_status'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Order Type Validation', () => {
    test('should accept valid order types', async () => {
      const validTypes = ['individual', 'subscription'];
      
      for (const orderType of validTypes) {
        const orderData = {
          user: user._id,
          chef: chef._id,
          foodName: 'Chicken Biryani',
          quantity: 2,
          orderType: orderType
        };

        const order = new Order(orderData);
        await order.save();
        expect(order.orderType).toBe(orderType);
        await Order.findByIdAndDelete(order._id);
      }
    });

    test('should reject invalid order type', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        orderType: 'invalid_type'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Subscription Order Details', () => {
    test('should save subscription order details', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        assignment: assignment._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        orderType: 'subscription',
        subscriptionOrder: {
          isSubscriptionOrder: true,
          subscriptionId: assignment._id,
          deliveryDay: 'monday',
          weekNumber: 1
        }
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.subscriptionOrder.isSubscriptionOrder).toBe(true);
      expect(order.subscriptionOrder.subscriptionId.toString()).toBe(assignment._id.toString());
      expect(order.subscriptionOrder.deliveryDay).toBe('monday');
      expect(order.subscriptionOrder.weekNumber).toBe(1);
    });

    test('should validate delivery day enum', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        orderType: 'subscription',
        subscriptionOrder: {
          isSubscriptionOrder: true,
          subscriptionId: assignment._id,
          deliveryDay: 'invalid_day',
          weekNumber: 1
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should validate week number range', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        orderType: 'subscription',
        subscriptionOrder: {
          isSubscriptionOrder: true,
          subscriptionId: assignment._id,
          deliveryDay: 'monday',
          weekNumber: 53
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Preparation and Delivery Time', () => {
    test('should save preparation time', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        preparationTime: {
          estimatedMinutes: 45,
          actualMinutes: 50
        }
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.preparationTime.estimatedMinutes).toBe(45);
      expect(order.preparationTime.actualMinutes).toBe(50);
    });

    test('should validate preparation time range', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        preparationTime: {
          estimatedMinutes: 10
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should save delivery time', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        deliveryTime: {
          estimatedMinutes: 20,
          actualMinutes: 25
        }
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.deliveryTime.estimatedMinutes).toBe(20);
      expect(order.deliveryTime.actualMinutes).toBe(25);
    });

    test('should validate delivery time range', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        deliveryTime: {
          estimatedMinutes: 3
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Order Timeline', () => {
    test('should initialize empty timeline', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.orderTimeline).toEqual([]);
    });

    test('should add timeline entry on status change', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        status: 'new'
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.orderTimeline).toHaveLength(1);
      expect(order.orderTimeline[0].status).toBe('new');
      expect(order.orderTimeline[0].updatedBy).toBe('system');
      expect(order.orderTimeline[0].timestamp).toBeDefined();
    });

    test('should add multiple timeline entries', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        status: 'new'
      };

      const order = new Order(orderData);
      await order.save();

      order.status = 'confirmed';
      await order.save();

      expect(order.orderTimeline).toHaveLength(2);
      expect(order.orderTimeline[0].status).toBe('new');
      expect(order.orderTimeline[1].status).toBe('confirmed');
    });
  });

  describe('Order Methods', () => {
    let order;

    beforeEach(async () => {
      order = await createTestOrder(user, chef, assignment);
    });

    test('should update status with updateStatus method', async () => {
      await order.updateStatus('confirmed', 'chef', 'Order confirmed by chef');

      expect(order.status).toBe('confirmed');
      expect(order.orderTimeline).toHaveLength(3);
      expect(order.orderTimeline[1].status).toBe('confirmed');
      expect(order.orderTimeline[1].updatedBy).toBe('chef');
      expect(order.orderTimeline[1].notes).toBe('Order confirmed by chef');
      expect(order.orderTimeline[2].status).toBe('confirmed');
      expect(order.orderTimeline[2].updatedBy).toBe('system');
    });

    test('should update status with location', async () => {
      const location = {
        latitude: 19.0760,
        longitude: 72.8777,
        address: 'Mumbai, Maharashtra'
      };

      await order.updateStatus('onTheWay', 'chef', 'Out for delivery', location);

      expect(order.status).toBe('onTheWay');
      expect(order.orderTimeline[1].location).toEqual(location);
    });

    test('should update status with estimated arrival', async () => {
      const estimatedArrival = new Date(Date.now() + 30 * 60 * 1000);

      await order.updateStatus('onTheWay', 'chef', 'Out for delivery', null, estimatedArrival);

      expect(order.status).toBe('onTheWay');
      expect(order.orderTimeline[1].estimatedArrival).toEqual(estimatedArrival);
    });

    test('should check if order can be cancelled', async () => {
      expect(order.canBeCancelled()).toBe(true);

      order.status = 'preparing';
      expect(order.canBeCancelled()).toBe(false);

      order.status = 'delivered';
      expect(order.canBeCancelled()).toBe(false);
    });

    test('should check if order can be updated by chef', async () => {
      expect(order.canBeUpdatedByChef()).toBe(false);

      order.status = 'confirmed';
      expect(order.canBeUpdatedByChef()).toBe(true);

      order.status = 'preparing';
      expect(order.canBeUpdatedByChef()).toBe(true);

      order.status = 'delivered';
      expect(order.canBeUpdatedByChef()).toBe(false);
    });

    test('should check if order is assigned', async () => {
      const result = order.isAssigned();
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);

      order.chef = null;
      expect(order.isAssigned()).toBe(false);

      order.chef = chef._id;
      order.assignment = null;
      expect(order.isAssigned()).toBe(false);
    });

    test('should calculate estimated delivery time', async () => {
      const scheduledDate = new Date('2024-12-25T12:00:00Z');
      order.scheduledDate = scheduledDate;
      order.preparationTime = { estimatedMinutes: 30 };
      order.deliveryTime = { estimatedMinutes: 15 };

      const estimatedDelivery = order.getEstimatedDeliveryTime();

      expect(estimatedDelivery).toBeDefined();
      expect(estimatedDelivery.getTime()).toBeGreaterThan(scheduledDate.getTime());
    });

    test('should return null for estimated delivery time without scheduled date', async () => {
      order.scheduledDate = null;

      const estimatedDelivery = order.getEstimatedDeliveryTime();

      expect(estimatedDelivery).toBeNull();
    });
  });

  describe('User Rating', () => {
    test('should save user rating', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        userRating: {
          rating: 5,
          review: 'Excellent food!',
          ratedAt: new Date()
        }
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.userRating.rating).toBe(5);
      expect(order.userRating.review).toBe('Excellent food!');
      expect(order.userRating.ratedAt).toBeDefined();
    });

    test('should validate rating range', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        userRating: {
          rating: 6
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should validate review length', async () => {
      const longReview = 'a'.repeat(1001);
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        userRating: {
          rating: 5,
          review: longReview
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Cancellation and Rejection', () => {
    test('should save cancellation details', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        status: 'cancelled',
        cancelReason: 'Customer requested cancellation',
        cancelledBy: 'user'
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.cancelReason).toBe('Customer requested cancellation');
      expect(order.cancelledBy).toBe('user');
    });

    test('should validate cancelledBy enum', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        status: 'cancelled',
        cancelledBy: 'invalid_user'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should save rejection details', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2,
        status: 'rejected',
        rejectionReason: 'Chef not available'
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.rejectionReason).toBe('Chef not available');
    });
  });

  describe('Timestamps', () => {
    test('should set createdAt and updatedAt timestamps', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2
      };

      const order = new Order(orderData);
      await order.save();

      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const orderData = {
        user: user._id,
        chef: chef._id,
        foodName: 'Chicken Biryani',
        quantity: 2
      };

      const order = new Order(orderData);
      await order.save();

      const originalUpdatedAt = order.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      order.foodName = 'Updated Food';
      await order.save();

      expect(order.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Database Indexes', () => {
    test('should have proper indexes for efficient queries', async () => {
      const indexes = await Order.collection.getIndexes();
      
      expect(indexes).toBeDefined();
      expect(Object.keys(indexes).length).toBeGreaterThan(1);
    });
  });
});
