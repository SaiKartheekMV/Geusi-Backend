const Review = require("../models/Review");
const Chef = require("../models/Chef");
const Order = require("../models/Order");

const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, images } = req.body;
    
    if (!orderId || !rating) {
      return res.status(400).json({ message: "Order ID and rating are required" });
    }
    

    const order = await Order.findOne({ 
      _id: orderId,
      user: req.user._id,
      status: "delivered"
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found or not eligible for review" });
    }
    

    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this order" });
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
    
    return res.status(201).json({ 
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getChefReviews = async (req, res) => {
  try {
    const { chefId } = req.params;
    
    const reviews = await Review.find({ chef: chefId })
      .populate("user", "firstName lastName profileImage")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error getting chef reviews:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("chef", "firstName lastName profileImage")
      .populate("order", "foodName scheduledDate")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error getting user reviews:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;
    
    const review = await Review.findOne({
      _id: reviewId,
      user: req.user._id
    });
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    

    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      return res.status(400).json({ message: "Reviews can only be updated within 7 days of creation" });
    }
    
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images) review.images = images;
    
    await review.save();
    

    await updateChefRating(review.chef);
    
    return res.status(200).json({ 
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findOne({
      _id: reviewId,
      user: req.user._id
    });
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    const chefId = review.chef;
    
    await review.deleteOne();
    

    await updateChefRating(chefId);
    
    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

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
