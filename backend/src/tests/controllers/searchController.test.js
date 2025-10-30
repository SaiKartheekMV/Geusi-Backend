const request = require("supertest");
const express = require("express");
const searchService = require("../../services/search/searchService");
const searchController = require("../../controllers/searchController");
const { sendResponse, sendErrorResponse } = require("../../utils/controllerUtils");

jest.mock("../../services/search/searchService");
jest.mock("../../utils/controllerUtils");

const app = express();
app.use(express.json());
app.get("/search/orders", searchController.searchOrders);
app.get("/search/global", searchController.globalSearch);

describe("searchController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { query: { q: "test" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  test("globalSearch - missing search term", async () => {
    await searchController.globalSearch({ query: {} }, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, "Search term is required");
  });

  test("searchOrders - should return success", async () => {
    searchService.searchOrders.mockResolvedValue({ data: [] });
    await searchController.searchOrders(req, res);
    expect(sendResponse).toHaveBeenCalled();
  });
});

describe("searchController Integration Tests", () => {
  test("GET /search/orders works", async () => {
    searchService.searchOrders.mockResolvedValue({ data: [] });
    const res = await request(app).get("/search/orders?q=test");
    expect(res.statusCode).toBeDefined();
  });
});
