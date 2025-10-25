const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const { logRequest } = require("./services/loggerService");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 9000;

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        credentials: true,
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(logRequest);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("Connected to Database");
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
};
connectDB();

app.get("/api/health", async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        res.status(200).json({
            status: "healthy",
            message: "Server and database are running smoothly.",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(500).json({
            status: "unhealthy",
            message: "Server or database is not functioning properly.",
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

const authRouter = require("./routes/authRoute");
const orderRouter = require("./routes/orderRoute");
const cookAuthRouter = require("./routes/cookAuthRoute");
const profileRouter = require("./routes/profileRoute");
const adminRouter = require("./routes/adminRoute");
const assignmentRouter = require("./routes/assignmentRoute");
const chefOrderRouter = require("./routes/chefOrderRoute");
const subscriptionRouter = require("./routes/subscriptionRoute");
const notificationRouter = require("./routes/notificationRoute");
const orderTrackingRouter = require("./routes/orderTrackingRoutes");
const chefAvailabilityRouter = require("./routes/chefAvailabilityRoutes");
const chefProfileRouter = require("./routes/chefProfileRoutes");
const reviewRouter = require("./routes/reviewRoutes");

app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRouter);
app.use("/api/cook-auth", cookAuthRouter);
app.use("/api/orders", orderRouter);
app.use("/api/profile", profileRouter);
app.use("/api/admin", adminRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/chef-orders", chefOrderRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/order-tracking", orderTrackingRouter);
app.use("/api/chef-availability", chefAvailabilityRouter);
app.use("/api/chef-profile", chefProfileRouter);
app.use("/api/reviews", reviewRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Server running on Port: ${PORT}`);
});

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
});

app.set("io", io);

const userSockets = new Map();

io.on("connection", async (socket) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return;

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const userId = decoded.userId;

        const existing = userSockets.get(userId) || new Set();
        existing.add(socket.id);
        userSockets.set(userId, existing);

        socket.data.userId = userId;
        socket.join(`user_${userId}`);

        socket.on("disconnect", () => {
            const set = userSockets.get(userId);
            if (set) {
                set.delete(socket.id);
                if (set.size === 0) userSockets.delete(userId);
                else userSockets.set(userId, set);
            }
        });
    } catch (err) {
        return;
    }
});

const shutdown = () => {
    server.close(() => {
        console.log("Server closed");
        mongoose.connection.close(() => {
            console.log("Database connection closed");
            process.exit(0);
        });
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
