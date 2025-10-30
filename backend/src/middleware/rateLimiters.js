const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  generalLimiter,
};


