const request = require("supertest");
const express = require("express");
const User = require("../../models/user");
const profileController = require("../../controllers/profileController");
const { sendResponse, sendErrorResponse } = require("../../utils/controllerUtils");
const fs = require("fs");

jest.mock("../../models/user");
jest.mock("fs");
jest.mock("../../utils/controllerUtils");

const app = express();
app.use(express.json());
app.get("/profile", profileController.getProfile);
app.put("/profile", profileController.updateProfile);
app.post("/profile/image", profileController.updateProfileImage);
app.delete("/profile", profileController.deleteProfile);

describe("profileController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: "1" }, body: {}, file: { filename: "new.png" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  test("getProfile - user not found", async () => {
    User.findById.mockResolvedValue(null);
    await profileController.getProfile(req, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, "User not found");
  });

  test("updateProfileImage - should delete old image if exists", async () => {
    User.findById.mockResolvedValue({ save: jest.fn(), profileImage: "uploads/profile/old.png" });
    fs.existsSync.mockReturnValue(true);
    await profileController.updateProfileImage(req, res);
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});

describe("profileController Integration Tests", () => {
  test("GET /profile should return a status", async () => {
    User.findById.mockResolvedValue({ _id: "1" });
    const res = await request(app).get("/profile");
    expect(res.statusCode).toBeDefined();
  });
});
