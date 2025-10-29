const Review = require("../models/Review");
const Chef = require("../models/Chef");
const Order = require("../models/order");
const { asyncHandler, sendResponse, sendErrorResponse } = require("../utils/controllerUtils");

const createReview = asyncHandler(async (req, res) => {
    const { orderId, rating, comment, images } = req.body;
    
    if (!orderId || !rating) {
      return sendErrorResponse(res, 400, "Order ID and rating are required");
    }
    

    const order = await Order.findOne({ 
      _id: orderId,
      user: req.user._id,
      status: "delivered"
    });
    
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found or not eligible for review");
    }
    

    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return sendErrorResponse(res, 400, "You have already reviewed this order");
    }
    

    const review = new Review({
      user: req.user._id,
      chef: order.chef,
      order: orderId,
      rating,
      comment: comment || "",
      images: images || []
    });
    
    await review.save();
    

    await updateChefRating(order.chef);
    
    return sendResponse(res, 201, { review }, "Review submitted successfully");
});

const getChefReviews = asyncHandler(async (req, res) => {
    const { chefId } = req.params;
    
    const reviews = await Review.find({ chef: chefId })
      .populate("user", "firstName lastName profileImage")
      .sort({ createdAt: -1 });
    
    return sendResponse(res, 200, { reviews }, "Chef reviews retrieved successfully");
});

const getUserReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ user: req.user._id })
      .populate("chef", "firstName lastName profileImage")
      .populate("order", "foodName scheduledDate")
      .sort({ createdAt: -1 });
    
    return sendResponse(res, 200, { reviews }, "User reviews retrieved successfully");
});

const updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;
    
    const review = await Review.findOne({
      _id: reviewId,
      user: req.user._id
    });
    
    if (!review) {
      return sendErrorResponse(res, 404, "Review not found");
    }
    

    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      return sendErrorResponse(res, 400, "Reviews can only be updated within 7 days of creation");
    }
    
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images) review.images = images;
    
    await review.save();
    

    await updateChefRating(review.chef);
    
    return sendResponse(res, 200, { review }, "Review updated successfully");
});

const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    
    const review = await Review.findOne({
      _id: reviewId,
      user: req.user._id
    });
    
    if (!review) {
      return sendErrorResponse(res, 404, "Review not found");
    }
    
    const chefId = review.chef;
    
    await review.deleteOne();
    

    await updateChefRating(chefId);
    
    return sendResponse(res, 200, null, "Review deleted successfully");
});

const updateChefRating = async (chefId) => {
  const reviews = await Review.find({ chef: chefId });
  
  if (reviews.length === 0) {
    await Chef.findByIdAndUpdate(chefId, { rating: 0 });
    return;
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await Chef.findByIdAndUpdate(chefId, { rating: averageRating });
};

module.exports = {
  createReview,
  getChefReviews,
  getUserReviews,
  updateReview,
  deleteReview
};
