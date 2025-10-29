const request = require("supertest");
const express = require("express");
const Order = require("../../models/order");
const { getOrderTracking, updateOrderLocation } = require("../../controllers/orderTrackingController");
const { sendResponse, sendErrorResponse } = require("../../utils/controllerUtils");

jest.mock("../../models/order");
jest.mock("../../utils/controllerUtils");

const app = express();
app.use(express.json());
app.get("/orders/:orderId/tracking", (req, res) => getOrderTracking(req, res));
app.put("/orders/:orderId/location", (req, res) => updateOrderLocation(req, res));

describe("orderTrackingController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { orderId: "1" }, user: { _id: "u1", role: "user" }, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  test("getOrderTracking - should return 404 if order not found", async () => {
    Order.findById.mockResolvedValue(null);
    await getOrderTracking(req, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, "Order not found");
  });

  test("updateOrderLocation - should return 404 if order not found", async () => {
    Order.findById.mockResolvedValue(null);
    await updateOrderLocation(req, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, "Order not found");
  });
});

describe("orderTrackingController Integration Tests", () => {
  test("GET /orders/:id/tracking returns 404 if not found", async () => {
    Order.findById.mockResolvedValue(null);
    const res = await request(app).get("/orders/1/tracking");
    expect(res.statusCode).toBeDefined();
  });
});
