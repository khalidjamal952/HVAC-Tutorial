require("dotenv").config();
const lectureRoutes = require("./routes/lectureRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const adminRoutes = require("./routes/adminRoutes");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const courseRoutes = require("./routes/courseRoutes");
const progressRoutes = require("./routes/progressRoutes");
const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const ebookRoutes = require("./routes/ebookRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const couponRoutes = require("./routes/couponRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/assets/videos", function (req, res, next) {
  return res.status(403).json({
    message: "Direct video access is not allowed.",
  });
});
app.use("/assets", express.static(path.join(__dirname, "../assets")));

const PORT = 5000;
connectDB();

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/coupons", couponRoutes);

app.use("/api/ratings", ratingRoutes);
app.get("/api/coupons/test-server", function (req, res) {
  res.json({
    success: true,
    message: "Coupon test route from server.js is working",
  });
});
app.get("/", function (req, res) {
  res.send("HVAC Tutorial Backend is Running!");
});

app.listen(PORT, function () {
  console.log(`Server running on http://localhost:${PORT}`);
});
