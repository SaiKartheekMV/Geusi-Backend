const {
  generateSubscriptionOrders,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionStatus,
  updateSubscriptionPreferences,
} = require("../../services/subscriptionService");

jest.mock("../../services/subscription/orderGenerationService");
jest.mock("../../services/subscription/subscriptionManagementService");
jest.mock("../../services/subscription/statusService");
jest.mock("../../services/subscription/preferencesService");

const orderGenerationService = require("../../services/subscription/orderGenerationService");
const subscriptionManagementService = require("../../services/subscription/subscriptionManagementService");
const statusService = require("../../services/subscription/statusService");
const preferencesService = require("../../services/subscription/preferencesService");

describe("subscriptionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateSubscriptionOrders", () => {
    it("should generate subscription orders successfully", async () => {
      const mockResult = {
        success: true,
        ordersCreated: 3,
        orders: [
          { _id: "order1", foodName: "Subscription Meal - Week 1" },
          { _id: "order2", foodName: "Subscription Meal - Week 2" },
          { _id: "order3", foodName: "Subscription Meal - Week 3" },
        ],
      };

      orderGenerationService.generateSubscriptionOrders.mockResolvedValue(mockResult);

      const result = await generateSubscriptionOrders(
        "assignment123",
        "2024-01-15",
        "2024-01-29"
      );

      expect(result.success).toBe(true);
      expect(result.ordersCreated).toBe(3);
      expect(result.orders).toBeDefined();
      expect(orderGenerationService.generateSubscriptionOrders).toHaveBeenCalledWith(
        "assignment123",
        "2024-01-15",
        "2024-01-29"
      );
    });

    it("should handle invalid assignment", async () => {
      const mockResult = {
        success: false,
        error: "Invalid subscription assignment",
      };

      orderGenerationService.generateSubscriptionOrders.mockResolvedValue(mockResult);

      const result = await generateSubscriptionOrders(
        "invalid123",
        "2024-01-15",
        "2024-01-29"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription assignment");
    });

    it("should handle non-subscription assignment", async () => {
      const mockResult = {
        success: false,
        error: "Invalid subscription assignment",
      };

      orderGenerationService.generateSubscriptionOrders.mockResolvedValue(mockResult);

      const result = await generateSubscriptionOrders(
        "assignment123",
        "2024-01-15",
        "2024-01-29"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription assignment");
    });

    it("should handle order creation errors", async () => {
      const mockResult = {
        success: false,
        error: "Validation error",
      };

      orderGenerationService.generateSubscriptionOrders.mockResolvedValue(mockResult);

      const result = await generateSubscriptionOrders(
        "assignment123",
        "2024-01-15",
        "2024-01-29"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation error");
    });
  });

  describe("pauseSubscription", () => {
    it("should pause subscription successfully", async () => {
      const mockResult = {
        success: true,
        message: "Subscription paused successfully",
      };

      subscriptionManagementService.pauseSubscription.mockResolvedValue(mockResult);

      const result = await pauseSubscription("assignment123", "User request");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Subscription paused successfully");
      expect(subscriptionManagementService.pauseSubscription).toHaveBeenCalledWith(
        "assignment123",
        "User request"
      );
    });

    it("should handle invalid assignment", async () => {
      const mockResult = {
        success: false,
        error: "Invalid subscription assignment",
      };

      subscriptionManagementService.pauseSubscription.mockResolvedValue(mockResult);

      const result = await pauseSubscription("invalid123", "User request");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription assignment");
    });

    it("should handle non-subscription assignment", async () => {
      const mockResult = {
        success: false,
        error: "Invalid subscription assignment",
      };

      subscriptionManagementService.pauseSubscription.mockResolvedValue(mockResult);

      const result = await pauseSubscription("assignment123", "User request");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription assignment");
    });
  });

  describe("resumeSubscription", () => {
    it("should resume subscription successfully", async () => {
      const mockResult = {
        success: true,
        message: "Subscription resumed successfully",
      };

      subscriptionManagementService.resumeSubscription.mockResolvedValue(mockResult);

      const result = await resumeSubscription("assignment123");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Subscription resumed successfully");
      expect(subscriptionManagementService.resumeSubscription).toHaveBeenCalledWith(
        "assignment123"
      );
    });

    it("should handle invalid assignment", async () => {
      const mockResult = {
        success: false,
        error: "Invalid subscription assignment",
      };

      subscriptionManagementService.resumeSubscription.mockResolvedValue(mockResult);

      const result = await resumeSubscription("invalid123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription assignment");
    });

    it("should handle non-suspended assignment", async () => {
      const mockResult = {
        success: false,
        error: "Assignment is not paused",
      };

      subscriptionManagementService.resumeSubscription.mockResolvedValue(mockResult);

      const result = await resumeSubscription("assignment123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Assignment is not paused");
    });
  });

  describe("getSubscriptionStatus", () => {
    it("should get subscription status successfully", async () => {
      const mockResult = {
        success: true,
        assignment: {
          _id: "assignment123",
          status: "active",
          subscriptionDetails: {
            planType: "weekly",
            mealsPerWeek: 3,
          },
        },
        orderStats: [
          { _id: "completed", count: 5 },
          { _id: "pending", count: 3 },
        ],
        upcomingOrders: [
          { _id: "order3", status: "confirmed", scheduledDate: new Date("2024-01-20") },
        ],
        totalOrders: 2,
      };

      statusService.getSubscriptionStatus.mockResolvedValue(mockResult);

      const result = await getSubscriptionStatus("assignment123");

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.orderStats).toBeDefined();
      expect(result.upcomingOrders).toBeDefined();
      expect(result.totalOrders).toBe(2);
      expect(statusService.getSubscriptionStatus).toHaveBeenCalledWith("assignment123");
    });

    it("should handle invalid assignment", async () => {
      const mockResult = {
        success: false,
        error: "Invalid subscription assignment",
      };

      statusService.getSubscriptionStatus.mockResolvedValue(mockResult);

      const result = await getSubscriptionStatus("invalid123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription assignment");
    });
  });

  describe("updateSubscriptionPreferences", () => {
    it("should update subscription preferences successfully", async () => {
      const mockResult = {
        success: true,
        message: "Subscription preferences updated successfully",
      };

      preferencesService.updateSubscriptionPreferences.mockResolvedValue(mockResult);

      const preferences = {
        cuisines: ["indian", "chinese"],
        dietaryRestrictions: ["vegan"],
        allergies: ["dairy"],
      };

      const result = await updateSubscriptionPreferences("assignment123", preferences);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Subscription preferences updated successfully");
      expect(preferencesService.updateSubscriptionPreferences).toHaveBeenCalledWith(
        "assignment123",
        preferences
      );
    });

    it("should handle invalid assignment", async () => {
      const mockResult = {
        success: false,
        error: "Invalid subscription assignment",
      };

      preferencesService.updateSubscriptionPreferences.mockResolvedValue(mockResult);

      const result = await updateSubscriptionPreferences("invalid123", {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription assignment");
    });

    it("should handle inactive subscription", async () => {
      const mockResult = {
        success: false,
        error: "Cannot update preferences for inactive subscription",
      };

      preferencesService.updateSubscriptionPreferences.mockResolvedValue(mockResult);

      const result = await updateSubscriptionPreferences("assignment123", {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot update preferences for inactive subscription");
    });
  });
});