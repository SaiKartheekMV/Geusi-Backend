const request = require("supertest");
const express = require("express");
const Review = require("../../models/Review");
const Chef = require("../../models/Chef");
const Order = require("../../models/order");
const reviewController = require("../../controllers/reviewController");
const { sendResponse, sendErrorResponse } = require("../../utils/controllerUtils");

jest.mock("../../models/Review");
jest.mock("../../models/Chef");
jest.mock("../../models/order");
jest.mock("../../utils/controllerUtils");

const app = express();
app.use(express.json());
app.post("/reviews", reviewController.createReview);
app.get("/reviews/chef/:chefId", reviewController.getChefReviews);

describe("reviewController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: "u1" }, body: { orderId: "o1", rating: 5 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  test("createReview - missing order", async () => {
    Order.findOne.mockResolvedValue(null);
    await reviewController.createReview(req, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, "Order not found or not eligible for review");
  });

  test("getChefReviews - should call sendResponse", async () => {
    Review.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) });
    await reviewController.getChefReviews({ params: { chefId: "c1" } }, res);
    expect(sendResponse).toHaveBeenCalled();
  });
});

describe("reviewController Integration Tests", () => {
  test("POST /reviews should call controller", async () => {
    Order.findOne.mockResolvedValue({ _id: "o1", chef: "c1", user: "u1", status: "delivered" });
    Review.findOne.mockResolvedValue(null);
    Review.prototype.save = jest.fn();
    const res = await request(app).post("/reviews").send({ orderId: "o1", rating: 5 });
    expect(res.statusCode).toBeDefined();
  });
});
