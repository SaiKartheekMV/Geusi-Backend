const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Joi = require("joi");
const { validateRequest } = require("../middleware/validationMiddleware");
const {
  createStripePaymentIntent,
  createRazorpayOrder,
  verifyRazorpaySignature,
  confirmCashOnDelivery,
} = require("../controllers/orderController");

router.use(authMiddleware);

router.post(
  "/stripe/intent",
  validateRequest(Joi.object({
    orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    amount: Joi.number().required(),
    currency: Joi.string().optional(),
  })),
  createStripePaymentIntent
);

router.post(
  "/razorpay/order",
  validateRequest(Joi.object({
    orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    amount: Joi.number().required(),
    currency: Joi.string().optional(),
    receipt: Joi.string().optional(),
  })),
  createRazorpayOrder
);

router.post(
  "/razorpay/verify",
  validateRequest(Joi.object({
    orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().required(),
    razorpaySignature: Joi.string().required(),
  })),
  verifyRazorpaySignature
);

router.post(
  "/cod",
  validateRequest(Joi.object({
    orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    amount: Joi.number().optional(),
    currency: Joi.string().optional(),
  })),
  confirmCashOnDelivery
);

module.exports = router;


