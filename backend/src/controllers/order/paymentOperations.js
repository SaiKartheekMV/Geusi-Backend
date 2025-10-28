const https = require("https");
const crypto = require("crypto");
const Order = require("../../models/Order");

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

const createStripePaymentIntent = async (req, res) => {
  try {
    if (!STRIPE_SECRET) return res.status(503).json({ message: "Stripe not configured" });

    const { orderId, amount, currency = "INR" } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: "orderId and amount are required" });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

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

    return res.status(201).json({
      message: "Stripe payment intent created",
      clientSecret: intent.client_secret,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Stripe intent error:", error);
    return res.status(500).json({ message: "Failed to create Stripe intent", error: error.message });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)
      return res.status(503).json({ message: "Razorpay not configured" });

    const { orderId, amount, currency = "INR", receipt } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: "orderId and amount are required" });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

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

    return res.status(201).json({
      message: "Razorpay order created",
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: RAZORPAY_KEY_ID,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ message: "Failed to create Razorpay order", error: error.message });
  }
};

const verifyRazorpaySignature = async (req, res) => {
  try {
    if (!RAZORPAY_KEY_SECRET)
      return res.status(503).json({ message: "Razorpay not configured" });

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
      return res.status(400).json({ message: "Missing verification params" });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const hmac = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValid = hmac === razorpaySignature;
    if (!isValid) return res.status(400).json({ message: "Invalid signature" });

    order.payment = order.payment || {};
    order.payment.method = "razorpay";
    order.payment.status = "paid";
    order.payment.providerIds = order.payment.providerIds || {};
    order.payment.providerIds.razorpayOrderId = razorpayOrderId;
    order.payment.providerIds.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    return res.status(200).json({ message: "Payment verified", orderId: order._id });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return res.status(500).json({ message: "Failed to verify Razorpay payment", error: error.message });
  }
};

const confirmCashOnDelivery = async (req, res) => {
  try {
    const { orderId, amount, currency = "INR" } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.payment = order.payment || {};
    order.payment.method = "cod";
    order.payment.status = "pending";
    if (amount != null) order.payment.amount = Number(amount);
    order.payment.currency = currency;
    await order.save();

    return res.status(200).json({ message: "COD selected", orderId: order._id });
  } catch (error) {
    console.error("COD confirm error:", error);
    return res.status(500).json({ message: "Failed to set COD", error: error.message });
  }
};

module.exports = {
  createStripePaymentIntent,
  createRazorpayOrder,
  verifyRazorpaySignature,
  confirmCashOnDelivery,
};


