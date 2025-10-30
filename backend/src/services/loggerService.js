const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "geusi-backend" },
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, "../logs/error.log"), 
      level: "error" 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, "../logs/combined.log") 
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
    });
  });
  
  next();
};

const logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
  
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
      ip: req.ip || req.connection.remoteAddress,
    };
  }
  
  logger.error("Application Error", errorInfo);
};

module.exports = {
  logger,
  logRequest,
  logError,
};
