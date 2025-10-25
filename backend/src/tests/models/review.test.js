const Review = require('../../models/Review');
const User = require('../../models/user');
const Chef = require('../../models/Chef');
const Order = require('../../models/order');
const {
  createTestUser,
  createTestChef,
  createTestAdmin,
  createTestOrder,
  createTestAssignment,
  createTestReview,
  cleanupTestData
} = require('../helpers');

describe('Review Model', () => {
  let user, chef, admin, order, assignment;

  beforeEach(async () => {
    await cleanupTestData();
    user = await createTestUser();
    chef = await createTestChef();
    admin = await createTestAdmin();
    assignment = await createTestAssignment(user, chef, admin);
    order = await createTestOrder(user, chef, assignment);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Review Creation and Validation', () => {
    test('should create a review with valid data', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: 'Excellent food and service!',
        isVerified: true
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review._id).toBeDefined();
      expect(review.user.toString()).toBe(user._id.toString());
      expect(review.chef.toString()).toBe(chef._id.toString());
      expect(review.order.toString()).toBe(order._id.toString());
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Excellent food and service!');
      expect(review.isVerified).toBe(true);
    });

    test('should require user', async () => {
      const reviewData = {
        chef: chef._id,
        order: order._id,
        rating: 5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should require chef', async () => {
      const reviewData = {
        user: user._id,
        order: order._id,
        rating: 5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should require order', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        rating: 5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should require rating', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should set default isVerified to false', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.isVerified).toBe(false);
    });

    test('should allow empty comment', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: ''
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.comment).toBe('');
    });

    test('should allow undefined comment', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.comment).toBeUndefined();
    });
  });

  describe('Rating Validation', () => {
    test('should accept valid rating values', async () => {
      const validRatings = [1, 2, 3, 4, 5];
      
      for (const rating of validRatings) {
        const reviewData = {
          user: user._id,
          chef: chef._id,
          order: order._id,
          rating: rating
        };

        const review = new Review(reviewData);
        await review.save();
        expect(review.rating).toBe(rating);
        await Review.findByIdAndDelete(review._id);
      }
    });

    test('should reject rating below minimum', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 0
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should reject rating above maximum', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 6
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should accept decimal ratings', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 4.5
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.rating).toBe(4.5);
    });
  });

  describe('Comment Validation', () => {
    test('should accept comment within length limit', async () => {
      const comment = 'a'.repeat(500);
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: comment
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.comment).toBe(comment);
    });

    test('should reject comment exceeding length limit', async () => {
      const comment = 'a'.repeat(501);
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: comment
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });
  });

  describe('Images Array', () => {
    test('should initialize empty images array', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.images).toEqual([]);
    });

    test('should save image URLs', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.images).toHaveLength(2);
      expect(review.images[0]).toBe('https://example.com/image1.jpg');
      expect(review.images[1]).toBe('https://example.com/image2.jpg');
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce one review per order', async () => {
      const reviewData1 = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: 'First review'
      };

      const reviewData2 = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 4,
        comment: 'Second review'
      };

      const review1 = new Review(reviewData1);
      await review1.save();

      const review2 = new Review(reviewData2);
      await expect(review2.save()).rejects.toThrow();
    });

    test('should allow multiple reviews for same user with different orders', async () => {
      const order2 = await createTestOrder(user, chef, assignment, {
        foodName: 'Different Meal'
      });

      const reviewData1 = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: 'First order review'
      };

      const reviewData2 = {
        user: user._id,
        chef: chef._id,
        order: order2._id,
        rating: 4,
        comment: 'Second order review'
      };

      const review1 = new Review(reviewData1);
      await review1.save();

      const review2 = new Review(reviewData2);
      await review2.save();

      expect(review1._id).toBeDefined();
      expect(review2._id).toBeDefined();
    });

    test('should allow multiple reviews for same chef with different orders', async () => {
      const user2 = await createTestUser({ email: 'user2@example.com', phone: '2222222222' });
      const order2 = await createTestOrder(user2, chef, assignment);

      const reviewData1 = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: 'First user review'
      };

      const reviewData2 = {
        user: user2._id,
        chef: chef._id,
        order: order2._id,
        rating: 4,
        comment: 'Second user review'
      };

      const review1 = new Review(reviewData1);
      await review1.save();

      const review2 = new Review(reviewData2);
      await review2.save();

      expect(review1._id).toBeDefined();
      expect(review2._id).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should set createdAt and updatedAt timestamps', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.createdAt).toBeDefined();
      expect(review.updatedAt).toBeDefined();
      expect(review.createdAt).toBeInstanceOf(Date);
      expect(review.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: 'Initial comment'
      };

      const review = new Review(reviewData);
      await review.save();

      const originalUpdatedAt = review.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      review.comment = 'Updated comment';
      await review.save();

      expect(review.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Database Indexes', () => {
    test('should have proper indexes for efficient queries', async () => {
      const indexes = await Review.collection.getIndexes();
      
      expect(indexes).toBeDefined();
      expect(Object.keys(indexes).length).toBeGreaterThan(1);
    });

    test('should enforce unique constraint on order field', async () => {
      const reviewData1 = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5
      };

      const reviewData2 = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 4
      };

      const review1 = new Review(reviewData1);
      await review1.save();

      const review2 = new Review(reviewData2);
      await expect(review2.save()).rejects.toThrow();
    });
  });

  describe('Verification Status', () => {
    test('should allow setting verification status', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        isVerified: true
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.isVerified).toBe(true);
    });

    test('should allow changing verification status', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        isVerified: false
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.isVerified).toBe(false);

      review.isVerified = true;
      await review.save();

      expect(review.isVerified).toBe(true);
    });
  });

  describe('Review Relationships', () => {
    test('should maintain proper relationships with user, chef, and order', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: 'Great service!'
      };

      const review = new Review(reviewData);
      await review.save();

      const populatedReview = await Review.findById(review._id)
        .populate('user', 'firstName lastName email')
        .populate('chef', 'firstName lastName email')
        .populate('order', 'foodName status');

      expect(populatedReview.user.firstName).toBe(user.firstName);
      expect(populatedReview.chef.firstName).toBe(chef.firstName);
      expect(populatedReview.order.foodName).toBe(order.foodName);
    });
  });

  describe('Edge Cases', () => {
    test('should handle review with minimum required fields', async () => {
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 1
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.rating).toBe(1);
      expect(review.comment).toBeUndefined();
      expect(review.images).toEqual([]);
      expect(review.isVerified).toBe(false);
    });

    test('should handle review with maximum fields', async () => {
      const longComment = 'a'.repeat(500);
      const reviewData = {
        user: user._id,
        chef: chef._id,
        order: order._id,
        rating: 5,
        comment: longComment,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ],
        isVerified: true
      };

      const review = new Review(reviewData);
      await review.save();

      expect(review.rating).toBe(5);
      expect(review.comment).toBe(longComment);
      expect(review.images).toHaveLength(3);
      expect(review.isVerified).toBe(true);
    });
  });
});
