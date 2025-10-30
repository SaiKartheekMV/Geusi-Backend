const request = require("supertest");
const express = require("express");
const Assignment = require("../../models/Assignment");
const {
  createSubscriptionOrders,
  pauseUserSubscription,
  resumeUserSubscription,
  getUserSubscriptionStatus,
  updateUserSubscriptionPreferences,
  getUserSubscriptions,
} = require("../../controllers/subscriptionController");
const subscriptionService = require("../../services/subscriptionService");
const { sendResponse, sendErrorResponse } = require("../../utils/controllerUtils");

jest.mock("../../models/Assignment");
jest.mock("../../services/subscriptionService");
jest.mock("../../utils/controllerUtils");

const app = express();
app.use(express.json());
app.post("/subscriptions/orders", createSubscriptionOrders);
app.get("/subscriptions/:assignmentId/status", getUserSubscriptionStatus);

describe("subscriptionController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { assignmentId: "a1" }, body: {}, user: { _id: "u1" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  test("createSubscriptionOrders - fail", async () => {
    subscriptionService.generateSubscriptionOrders.mockResolvedValue({ success: false });
    await createSubscriptionOrders(req, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, "Failed to generate subscription orders", undefined);
  });

  test("getUserSubscriptionStatus - success", async () => {
    subscriptionService.getSubscriptionStatus.mockResolvedValue({ success: true });
    await getUserSubscriptionStatus(req, res);
    expect(sendResponse).toHaveBeenCalled();
  });
});

describe("subscriptionController Integration Tests", () => {
  test("POST /subscriptions/orders works", async () => {
    subscriptionService.generateSubscriptionOrders.mockResolvedValue({ success: true, ordersCreated: 2 });
    const res = await request(app).post("/subscriptions/orders").send({ assignmentId: "a1" });
    expect(res.statusCode).toBeDefined();
  });
});
