const express = require("express");
const router = express.Router();
const { 
  createReview, 
  getChefReviews, 
  getUserReviews, 
  updateReview, 
  deleteReview 
} = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/", authMiddleware, createReview);


router.get("/chef/:chefId", getChefReviews);


router.get("/my-reviews", authMiddleware, getUserReviews);


router.put("/:reviewId", authMiddleware, updateReview);


router.delete("/:reviewId", authMiddleware, deleteReview);

module.exports = router;
