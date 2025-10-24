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

// Create a new review
router.post("/", authMiddleware, createReview);

// Get reviews for a chef
router.get("/chef/:chefId", getChefReviews);

// Get reviews by a user
router.get("/my-reviews", authMiddleware, getUserReviews);

// Update a review
router.put("/:reviewId", authMiddleware, updateReview);

// Delete a review
router.delete("/:reviewId", authMiddleware, deleteReview);

module.exports = router;