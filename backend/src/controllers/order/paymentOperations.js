const https = require("https");
const crypto = require("crypto");
const Order = require("../../models/order");
const { sendResponse, sendErrorResponse, asyncHandler } = require("../../utils/controllerUtils");

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const httpPostForm = (hostname, path, authHeader, formData) => {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(formData).toString();
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(data),
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) return resolve(parsed);
            reject(new Error(parsed.error?.message || body));
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) return resolve({ raw: body });
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
};

const createStripePaymentIntent = asyncHandler(async (req, res) => {
  if (!STRIPE_SECRET) {
    return sendErrorResponse(res, 503, "Stripe not configured");
  }

  const { orderId, amount, currency = "INR" } = req.body;
  if (!orderId || !amount) {
    return sendErrorResponse(res, 400, "orderId and amount are required");
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  const intent = await httpPostForm(
    "api.stripe.com",
    "/v1/payment_intents",
    `Bearer ${STRIPE_SECRET}`,
    {
      amount: Math.round(Number(amount) * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    }
  );

  order.payment = order.payment || {};
  order.payment.method = "stripe";
  order.payment.status = "requires_payment";
  order.payment.currency = currency;
  order.payment.amount = Number(amount);
  order.payment.providerIds = order.payment.providerIds || {};
  order.payment.providerIds.stripePaymentIntentId = intent.id;
  await order.save();

  return sendResponse(res, 201, {
    clientSecret: intent.client_secret,
    orderId: order._id,
  }, "Stripe payment intent created");
});

const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return sendErrorResponse(res, 503, "Razorpay not configured");
  }

  const { orderId, amount, currency = "INR", receipt } = req.body;
  if (!orderId || !amount) {
    return sendErrorResponse(res, 400, "orderId and amount are required");
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  const auth = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const rpOrder = await httpPostForm("api.razorpay.com", "/v1/orders", auth, {
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt: receipt || `rcpt_${orderId}`,
  });

  order.payment = order.payment || {};
  order.payment.method = "razorpay";
  order.payment.status = "requires_payment";
  order.payment.currency = currency;
  order.payment.amount = Number(amount);
  order.payment.providerIds = order.payment.providerIds || {};
  order.payment.providerIds.razorpayOrderId = rpOrder.id;
  await order.save();

  return sendResponse(res, 201, {
    razorpayOrderId: rpOrder.id,
    amount: rpOrder.amount,
    currency: rpOrder.currency,
    keyId: RAZORPAY_KEY_ID,
    orderId: order._id,
  }, "Razorpay order created");
});

const verifyRazorpaySignature = asyncHandler(async (req, res) => {
  if (!RAZORPAY_KEY_SECRET) {
    return sendErrorResponse(res, 503, "Razorpay not configured");
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return sendErrorResponse(res, 400, "Missing verification params");
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  const hmac = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const isValid = hmac === razorpaySignature;
  if (!isValid) {
    return sendErrorResponse(res, 400, "Invalid signature");
  }

  order.payment = order.payment || {};
  order.payment.method = "razorpay";
  order.payment.status = "paid";
  order.payment.providerIds = order.payment.providerIds || {};
  order.payment.providerIds.razorpayOrderId = razorpayOrderId;
  order.payment.providerIds.razorpayPaymentId = razorpayPaymentId;
  await order.save();

  return sendResponse(res, 200, { orderId: order._id }, "Payment verified");
});

const confirmCashOnDelivery = asyncHandler(async (req, res) => {
  const { orderId, amount, currency = "INR" } = req.body;
  if (!orderId) {
    return sendErrorResponse(res, 400, "orderId is required");
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    return sendErrorResponse(res, 404, "Order not found");
  }

  order.payment = order.payment || {};
  order.payment.method = "cod";
  order.payment.status = "pending";
  if (amount != null) order.payment.amount = Number(amount);
  order.payment.currency = currency;
  await order.save();

  return sendResponse(res, 200, { orderId: order._id }, "COD selected");
});

module.exports = {
  createStripePaymentIntent,
  createRazorpayOrder,
  verifyRazorpaySignature,
  confirmCashOnDelivery,
};


