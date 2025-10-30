const { validateRequest, validateParams, validateQuery, schemas } = require("../../middleware/validationMiddleware");
const Joi = require("joi");

describe("validationMiddleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("validateRequest", () => {
    it("should call next() when validation passes", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });

      mockReq.body = {
        name: "John Doe",
        email: "john@example.com",
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should return 400 error when validation fails", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });

      mockReq.body = {
        name: "",
        email: "invalid-email",
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Validation error",
        errors: expect.stringContaining("name"),
      });
    });

    it("should handle multiple validation errors", () => {
      const schema = Joi.object({
        name: Joi.string().min(2).required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).required(),
      });

      mockReq.body = {
        name: "A",
        email: "invalid",
        age: 15,
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Validation error",
        errors: expect.stringContaining("name"),
      });
    });
  });

  describe("validateParams", () => {
    it("should call next() when params validation passes", () => {
      const schema = Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      });

      mockReq.params = {
        id: "507f1f77bcf86cd799439011",
      };

      const middleware = validateParams(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should return 400 error when params validation fails", () => {
      const schema = Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      });

      mockReq.params = {
        id: "invalid-id",
      };

      const middleware = validateParams(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Parameter validation error",
        errors: expect.stringContaining("id"),
      });
    });
  });

  describe("validateQuery", () => {
    it("should call next() when query validation passes", () => {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
      });

      mockReq.query = {
        page: 1,
        limit: 10,
      };

      const middleware = validateQuery(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should return 400 error when query validation fails", () => {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
      });

      mockReq.query = {
        page: 0,
        limit: 200,
      };

      const middleware = validateQuery(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Query validation error",
        errors: expect.stringContaining("page"),
      });
    });
  });

  describe("schemas", () => {
    describe("userRegistration", () => {
      it("should validate correct user registration data", () => {
        const validData = {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "password123",
        };

        const { error } = schemas.userRegistration.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid user registration data", () => {
        const invalidData = {
          firstName: "A",
          lastName: "",
          email: "invalid-email",
          phone: "123",
          password: "123",
        };

        const { error } = schemas.userRegistration.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details.length).toBeGreaterThan(0);
      });
    });

    describe("login", () => {
      it("should validate correct login data", () => {
        const validData = {
          email: "john@example.com",
          password: "password123",
        };

        const { error } = schemas.login.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid login data", () => {
        const invalidData = {
          email: "invalid-email",
          password: "",
        };

        const { error } = schemas.login.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("orderCreation", () => {
      it("should validate correct order creation data", () => {
        const validData = {
          foodName: "Pizza",
          description: "Delicious pizza",
          quantity: 2,
          numberOfPersons: 4,
          scheduledDate: "2024-01-15",
          scheduledTime: "18:30",
          specialInstructions: "Extra cheese",
          deliveryAddress: {
            street: "123 Main Street",
            city: "New York",
            state: "NY",
            pincode: "100001",
            landmark: "Near Central Park",
          },
          estimatedPrice: 25.99,
        };

        const { error } = schemas.orderCreation.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid order creation data", () => {
        const invalidData = {
          foodName: "",
          quantity: 0,
          deliveryAddress: {
            street: "123",
            city: "",
          },
        };

        const { error } = schemas.orderCreation.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("assignmentCreation", () => {
      it("should validate correct assignment creation data", () => {
        const validData = {
          userId: "507f1f77bcf86cd799439011",
          chefId: "507f1f77bcf86cd799439012",
          assignmentType: "subscription",
          subscriptionDetails: {
            planType: "weekly",
            mealsPerWeek: 5,
            deliveryDays: ["monday", "wednesday", "friday"],
            mealPreferences: {
              cuisines: ["indian", "chinese"],
              dietaryRestrictions: ["vegan"],
              allergies: ["nuts"],
            },
          },
          notes: "Special dietary requirements",
        };

        const { error } = schemas.assignmentCreation.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid assignment creation data", () => {
        const invalidData = {
          userId: "invalid-id",
          chefId: "507f1f77bcf86cd799439012",
          assignmentType: "invalid-type",
        };

        const { error } = schemas.assignmentCreation.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("pagination", () => {
      it("should validate correct pagination data", () => {
        const validData = {
          page: 1,
          limit: 10,
        };

        const { error } = schemas.pagination.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid pagination data", () => {
        const invalidData = {
          page: 0,
          limit: 200,
        };

        const { error } = schemas.pagination.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("objectId", () => {
      it("should validate correct MongoDB ObjectId", () => {
        const validData = {
          id: "507f1f77bcf86cd799439011",
        };

        const { error } = schemas.objectId.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid MongoDB ObjectId", () => {
        const invalidData = {
          id: "invalid-id",
        };

        const { error } = schemas.objectId.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("profileUpdate", () => {
      it("should validate correct profile update data", () => {
        const validData = {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          householdSize: 4,
          address: {
            street: "123 Main Street",
            city: "New York",
            state: "NY",
            pincode: "100001",
          },
          currentLocation: "New York, NY",
          preferences: {
            cuisines: ["indian", "chinese"],
            dietaryType: "Veg",
            allergies: ["nuts"],
            notificationsEnabled: true,
            language: "English",
            accessibility: false,
            privacyAccepted: true,
          },
        };

        const { error } = schemas.profileUpdate.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid profile update data", () => {
        const invalidData = {
          firstName: "",
          phone: "123",
          householdSize: 0,
          preferences: {
            dietaryType: "Invalid",
          },
        };

        const { error } = schemas.profileUpdate.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("orderRating", () => {
      it("should validate correct order rating data", () => {
        const validData = {
          rating: 5,
          review: "Excellent food and service!",
        };

        const { error } = schemas.orderRating.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid order rating data", () => {
        const invalidData = {
          rating: 6,
          review: "A".repeat(1001),
        };

        const { error } = schemas.orderRating.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("subscriptionPreferences", () => {
      it("should validate correct subscription preferences data", () => {
        const validData = {
          preferences: {
            cuisines: ["indian", "chinese"],
            dietaryRestrictions: ["vegan"],
            allergies: ["nuts"],
          },
        };

        const { error } = schemas.subscriptionPreferences.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid subscription preferences data", () => {
        const invalidData = {
          preferences: {
            cuisines: [],
            dietaryRestrictions: [],
            allergies: [],
          },
        };

        const { error } = schemas.subscriptionPreferences.validate(invalidData);
        expect(error).toBeUndefined();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty request body", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = {};

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle null request body", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = null;

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle undefined request body", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = undefined;

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle optional fields correctly", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
      });

      mockReq.body = {
        name: "Test",
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle array validation", () => {
      const schema = Joi.object({
        items: Joi.array().items(Joi.string()).required(),
      });

      mockReq.body = {
        items: ["item1", "item2", "item3"],
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle nested object validation", () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
        }).required(),
      });

      mockReq.body = {
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
