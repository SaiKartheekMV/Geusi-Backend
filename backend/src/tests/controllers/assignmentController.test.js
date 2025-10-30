const request = require("supertest");
const express = require("express");
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require("../../controllers/assignmentController");

const Assignment = require("../../models/Assignment");
const { createAssignmentService, updateAssignmentService, deleteAssignmentService } = require("../../services/assignment/assignmentOperationsService");

jest.mock("../../models/Assignment");
jest.mock("../../services/assignment/assignmentOperationsService");

jest.mock("../../middleware/adminAuthMiddleware", () => ({
  adminAuthMiddleware: (req, res, next) => {
    req.user = { _id: "admin123", role: "admin" };
    next();
  },
  requirePermission: () => (req, res, next) => next(),
}));

jest.mock("../../middleware/validationMiddleware", () => ({
  validateRequest: () => (req, res, next) => next(),
  validateParams: () => (req, res, next) => next(),
  validateQuery: () => (req, res, next) => next(),
  schemas: {
    assignmentCreation: {},
    assignmentSearch: {},
    assignmentStats: {},
    availableChefs: {},
    pagination: {},
    objectId: {},
    assignmentUpdate: {},
    suspendAssignment: {},
    bulkAssignment: {},
  },
}));

describe("assignmentController", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    const assignmentRoutes = require("../../routes/assignmentRoute");
    app.use("/assignments", assignmentRoutes);
    
    jest.clearAllMocks();
  });

  describe("POST /assignments (createAssignment)", () => {
    it("should create assignment successfully", async () => {
      const mockReq = {
        user: { _id: "admin123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          userId: "user123",
          chefId: "chef123",
          assignmentType: "individual",
          notes: "Test assignment",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAssignment = {
        _id: "assignment123",
        user: "user123",
        chef: "chef123",
        assignedBy: "admin123",
        assignmentType: "individual",
        notes: "Test assignment",
      };

      const mockServiceResponse = {
        success: true,
        message: "Assignment created successfully",
        assignment: mockAssignment,
      };

      createAssignmentService.mockResolvedValue(mockServiceResponse);

      await createAssignment(mockReq, mockRes);

      expect(createAssignmentService).toHaveBeenCalledWith(
        {
          userId: "user123",
          chefId: "chef123",
          assignmentType: "individual",
          notes: "Test assignment",
        },
        "admin123",
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Assignment created successfully",
        assignment: mockAssignment,
      });
    });

    it("should return 400 for validation failure", async () => {
      const mockReq = {
        user: { _id: "admin123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          userId: "user123",
          chefId: "chef123",
          assignmentType: "individual",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockServiceResponse = {
        success: false,
        message: "Assignment validation failed",
        errors: ["User not found", "Chef not available"],
      };

      createAssignmentService.mockResolvedValue(mockServiceResponse);

      await createAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Assignment validation failed",
        errors: ["User not found", "Chef not available"],
      });
    });

    it("should handle database errors", async () => {
      const mockReq = {
        user: { _id: "admin123" },
        app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
        body: {
          userId: "user123",
          chefId: "chef123",
          assignmentType: "individual",
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      createAssignmentService.mockRejectedValue(new Error("Database error"));

      await createAssignment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Failed to create assignment",
        error: "Database error",
      });
    });
  });

  describe("GET /assignments (getAssignments)", () => {
    it("should get assignments with pagination", async () => {
      const mockReq = {
        query: { page: 1, limit: 10 },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAssignments = [
        { _id: "assignment1", user: "user1", chef: "chef1" },
        { _id: "assignment2", user: "user2", chef: "chef2" },
      ];

      Assignment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue(mockAssignments),
                }),
              }),
            }),
          }),
        }),
      });
      Assignment.countDocuments.mockResolvedValue(2);

      await getAssignments(mockReq, mockRes);

      expect(Assignment.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        assignments: mockAssignments,
        pagination: {
          total: 2,
          page: 1,
          pages: 1,
        },
      });
    });

    it("should filter assignments by status", async () => {
      const mockReq = {
        query: { status: "active" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Assignment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });
      Assignment.countDocuments.mockResolvedValue(0);

      await getAssignments(mockReq, mockRes);

      expect(Assignment.find).toHaveBeenCalledWith({ status: "active" });
    });
  });

  describe("Controller Integration Tests", () => {
    beforeEach(() => {
      app.post("/assignments", createAssignment);
      app.get("/assignments", getAssignments);
    });

    it("should handle create assignment endpoint correctly", async () => {
      const mockAssignment = {
        _id: "assignment123",
        user: "user123",
        chef: "chef123",
      };

      const mockServiceResponse = {
        success: true,
        message: "Assignment created successfully",
        assignment: mockAssignment,
      };

      createAssignmentService.mockResolvedValue(mockServiceResponse);

      const response = await request(app)
        .post("/assignments")
        .send({
          userId: "user123",
          chefId: "chef123",
          assignmentType: "individual",
        })
        .set("Authorization", "Bearer mock-token");

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Assignment created successfully");
    });

    it("should handle get assignments endpoint correctly", async () => {
      const mockAssignments = [
        { _id: "assignment1", user: "user1", chef: "chef1" },
      ];

      Assignment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue(mockAssignments),
                }),
              }),
            }),
          }),
        }),
      });
      Assignment.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get("/assignments")
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.assignments).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });
});
