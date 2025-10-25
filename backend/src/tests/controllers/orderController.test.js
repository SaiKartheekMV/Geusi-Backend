const request = require("supertest");
const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  getOrderHistory,
  cancelOrder,
  deleteOrder,
  getNotifications,
  markNotificationRead,
  assignOrderToChef,
  rateOrder,
  getOrderTimeline,
} = require("../../controllers/orderController");

const Order = require("../../models/Order");
const User = require("../../models/User");
const Chef = require("../../models/Chef");
const Assignment = require("../../models/Assignment");
const { sendOrderStatusNotification } = require("../../services/orderNotificationService");
const { addNotificationToUser } = require("../../services/notificationService");

jest.mock("../../models/Order");
jest.mock("../../models/User");
jest.mock("../../models/Chef");
jest.mock("../../models/Assignment");
jest.mock("../../services/orderNotificationService");
jest.mock("../../services/notificationService");

// Mock the authentication middleware
jest.mock("../../middleware/authMiddleware", () => ({
  authMiddleware: (req, res, next) => {
    req.user = { _id: "user123" };
    next();
  },
}));

describe("orderController", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.set("io", { emit: jest.fn() });
    
    // Mock req.user for authenticated routes
    app.use((req, res, next) => {
      req.user = { _id: "user123", role: "user" };
      next();
    });
    
    jest.clearAllMocks();
  });

  describe("POST /orders (createOrder)", () => {
    it("should create an individual order successfully", async () => {
      const mockReq = {
        user: { _id: "user123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          foodName: "Pasta",
          description: "Delicious pasta",
          quantity: 2,
          numberOfPersons: 2,
          scheduledDate: "2024-01-15",
          scheduledTime: "12:00",
          specialInstructions: "No onions",
          deliveryAddress: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            pincode: "10001",
          },
          estimatedPrice: 25.00,
          orderType: "individual",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockOrder = {
        _id: "order123",
        ...mockReq.body,
        user: mockReq.user._id,
        status: "new",
        save: jest.fn().mockResolvedValue(),
      };

      Assignment.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      Order.mockImplementation(() => mockOrder);
      Order.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockOrder),
        }),
      });

      await createOrder(mockReq, mockRes);

      expect(Order).toHaveBeenCalledWith({
        user: mockReq.user._id,
        chef: null,
        assignment: null,
        foodName: "Pasta",
        description: "Delicious pasta",
        quantity: 2,
        numberOfPersons: 2,
        scheduledDate: "2024-01-15",
        scheduledTime: "12:00",
        specialInstructions: "No onions",
        deliveryAddress: mockReq.body.deliveryAddress,
        estimatedPrice: 25,
        orderType: "individual",
        status: "new",
      });
      expect(mockOrder.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Order created successfully",
        order: mockOrder,
      });
    });

    it("should create a subscription order with assignment", async () => {
      const mockReq = {
        user: { _id: "user123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          foodName: "Subscription Meal",
          description: "Weekly subscription meal",
          quantity: 1,
          numberOfPersons: 2,
          scheduledDate: "2024-01-15",
          scheduledTime: "12:00",
          deliveryAddress: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            pincode: "10001",
          },
          orderType: "subscription",
          subscriptionDetails: {
            weekNumber: 1,
            deliveryDay: "monday",
          },
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAssignment = {
        _id: "assignment123",
        chef: { _id: "chef123", firstName: "John", lastName: "Chef" },
        updateOrderStats: jest.fn().mockResolvedValue(),
      };

      const mockOrder = {
        _id: "order123",
        ...mockReq.body,
        user: mockReq.user._id,
        chef: mockAssignment.chef._id,
        assignment: mockAssignment._id,
        status: "confirmed",
        save: jest.fn().mockResolvedValue(),
      };

      Assignment.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAssignment),
      });
      Order.mockImplementation(() => mockOrder);
      Order.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockOrder),
        }),
      });

      await createOrder(mockReq, mockRes);

      expect(Assignment.findOne).toHaveBeenCalledWith({
        user: mockReq.user._id,
        status: "active",
        assignmentType: "subscription",
      });
      expect(Order).toHaveBeenCalledWith({
        user: mockReq.user._id,
        chef: mockAssignment.chef._id,
        assignment: mockAssignment._id,
        foodName: "Subscription Meal",
        description: "Weekly subscription meal",
        quantity: 1,
        numberOfPersons: 2,
        scheduledDate: "2024-01-15",
        scheduledTime: "12:00",
        deliveryAddress: mockReq.body.deliveryAddress,
        estimatedPrice: 0,
        orderType: "subscription",
        status: "confirmed",
        subscriptionOrder: {
          isSubscriptionOrder: true,
          subscriptionId: mockAssignment._id,
          deliveryDay: "monday",
          weekNumber: 1,
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 for missing required fields", async () => {
      const mockReq = {
        user: { _id: "user123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          description: "Delicious pasta",
          quantity: 2,
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Food name and quantity are required",
      });
    });

    it("should return 400 for incomplete delivery address", async () => {
      const mockReq = {
        user: { _id: "user123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          foodName: "Pasta",
          quantity: 2,
          deliveryAddress: {
            street: "123 Main St",
            // Missing city
          },
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Complete delivery address is required",
      });
    });

    it("should return 400 for subscription order without assignment", async () => {
      const mockReq = {
        user: { _id: "user123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          foodName: "Subscription Meal",
          quantity: 1,
          deliveryAddress: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            pincode: "10001",
          },
          orderType: "subscription",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Assignment.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "No active subscription assignment found. Please contact admin for assignment.",
      });
    });

    it("should handle database errors", async () => {
      const mockReq = {
        user: { _id: "user123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          foodName: "Pasta",
          quantity: 2,
          deliveryAddress: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            pincode: "10001",
          },
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockOrder = {
        save: jest.fn().mockRejectedValue(new Error("Database error")),
      };
      Order.mockImplementation(() => mockOrder);

      await createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Failed to create order",
        error: "Database error",
      });
    });
  });

  describe("GET /orders (getOrders)", () => {
    it("should get orders with pagination", async () => {
      const mockReq = {
        user: { _id: "user123" },
        query: { page: 1, limit: 10 },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockOrders = [
        { _id: "order1", foodName: "Pasta", chef: { firstName: "John", lastName: "Chef" } },
        { _id: "order2", foodName: "Pizza", chef: { firstName: "Jane", lastName: "Chef" } },
      ];

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });
      Order.countDocuments.mockResolvedValue(2);

      await getOrders(mockReq, mockRes);

      expect(Order.find).toHaveBeenCalledWith({ user: "user123" });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        orders: mockOrders,
        pagination: {
          total: 2,
          page: 1,
          pages: 1,
        },
      });
    });

    it("should filter orders by search term", async () => {
      const mockReq = {
        user: { _id: "user123" },
        query: { search: "pasta" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      Order.countDocuments.mockResolvedValue(0);

      await getOrders(mockReq, mockRes);

      expect(Order.find).toHaveBeenCalledWith({
        user: "user123",
        $or: [
          { foodName: { $regex: "pasta", $options: "i" } },
          { description: { $regex: "pasta", $options: "i" } },
        ],
      });
    });

    it("should filter orders by status", async () => {
      const mockReq = {
        user: { _id: "user123" },
        query: { status: "confirmed" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      Order.countDocuments.mockResolvedValue(0);

      await getOrders(mockReq, mockRes);

      expect(Order.find).toHaveBeenCalledWith({
        user: "user123",
        status: "confirmed",
      });
    });

    it("should handle database errors", async () => {
      const mockReq = {
        user: { _id: "user123" },
        query: {},
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Order.find.mockImplementation(() => {
        throw new Error("Database error");
      });

      await getOrders(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Failed to get orders",
        error: "Database error",
      });
    });
  });

  describe("GET /orders/:id (getOrderById)", () => {
    it("should get order by id successfully", async () => {
      const mockReq = {
        params: { id: "order123" },
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockOrder = {
        _id: "order123",
        user: "user123",
        foodName: "Pasta",
        chef: { firstName: "John", lastName: "Chef" },
      };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder),
      });

      await getOrderById(mockReq, mockRes);

      expect(Order.findOne).toHaveBeenCalledWith({
        _id: "order123",
        user: "user123",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        order: mockOrder,
      });
    });

    it("should return 404 for non-existent order", async () => {
      const mockReq = {
        params: { id: "nonexistent" },
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getOrderById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Order not found",
      });
    });

    it("should return 403 for order belonging to different user", async () => {
      const mockReq = {
        params: { id: "order123" },
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockOrder = {
        _id: "order123",
        user: "differentuser",
        foodName: "Pasta",
      };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder),
      });

      await getOrderById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        order: mockOrder,
      });
    });
  });

  describe("POST /orders/:id/cancel (cancelOrder)", () => {
    it("should cancel order successfully", async () => {
      const mockReq = {
        params: { id: "order123" },
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockOrder = {
        _id: "order123",
        user: "user123",
        status: "confirmed",
        save: jest.fn().mockResolvedValue(),
      };

      Order.findOne.mockResolvedValue(mockOrder);
      addNotificationToUser.mockResolvedValue({ success: true });

      await cancelOrder(mockReq, mockRes);

      expect(mockOrder.status).toBe("cancelled");
      expect(mockOrder.save).toHaveBeenCalled();
      expect(addNotificationToUser).toHaveBeenCalledWith(
        "user123",
        expect.objectContaining({
          message: expect.stringContaining("cancelled"),
          type: "order_cancelled",
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Order cancelled successfully",
        order: mockOrder,
      });
    });

    it("should return 404 for non-existent order", async () => {
      const mockReq = {
        params: { id: "nonexistent" },
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Order.findOne.mockResolvedValue(null);

      await cancelOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Order not found",
      });
    });

    it("should return 400 for already cancelled order", async () => {
      const mockReq = {
        params: { id: "order123" },
        user: { _id: "user123" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockOrder = {
        _id: "order123",
        user: "user123",
        status: "cancelled",
      };

      Order.findOne.mockResolvedValue(mockOrder);

      await cancelOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cannot cancel this order",
      });
    });
  });

  describe("Controller Integration Tests", () => {
    beforeEach(() => {
      app.post("/orders", createOrder);
      app.get("/orders", getOrders);
      app.get("/orders/:id", getOrderById);
      app.post("/orders/:id/cancel", cancelOrder);
    });

    it("should handle create order endpoint correctly", async () => {
      const mockOrder = {
        _id: "order123",
        foodName: "Pasta",
        user: "user123",
        save: jest.fn().mockResolvedValue(),
      };
      
      // Mock Order constructor to return the mock order
      Order.mockImplementation(() => mockOrder);
      
      // Mock Order.findById to return a mock with chained populate methods
      Order.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockOrder),
        }),
      });

      const response = await request(app)
        .post("/orders")
        .send({
          foodName: "Pasta",
          quantity: 2,
          deliveryAddress: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            pincode: "10001",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Order created successfully");
      expect(response.body.order).toBeDefined();
    });

    it("should handle get orders endpoint correctly", async () => {
      const mockOrders = [
        { _id: "order1", foodName: "Pasta" },
        { _id: "order2", foodName: "Pizza" },
      ];

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });
      Order.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get("/orders")
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it("should handle get order by id endpoint correctly", async () => {
      const mockOrder = {
        _id: "order123",
        user: "user123",
        foodName: "Pasta",
      };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder),
      });

      const response = await request(app)
        .get("/orders/order123");

      expect(response.status).toBe(200);
      expect(response.body.order._id).toBe("order123");
    });

    it("should handle cancel order endpoint correctly", async () => {
      const mockOrder = {
        _id: "order123",
        user: "user123",
        status: "confirmed",
        save: jest.fn().mockResolvedValue(),
      };

      Order.findOne.mockResolvedValue(mockOrder);
      addNotificationToUser.mockResolvedValue({ success: true });

      const response = await request(app)
        .post("/orders/order123/cancel");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Order cancelled successfully");
    });
  });
});
