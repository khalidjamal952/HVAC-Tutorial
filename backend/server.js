require("dotenv").config();
// const lectureRoutes = require("./routes/lectureRoutes");
const lectureRoutes = require("./routes/lectureRoutes.r2");
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
const ebookPurchaseRoutes = require("./routes/ebookPurchaseRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const couponRoutes = require("./routes/couponRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/assets/videos", function (req, res, next) {
  return res.status(403).json({
    message: "Direct video access is not allowed.",
  });
});
app.use("/assets/ebooks", function (req, res, next) {
  return res.status(403).json({
    message: "Direct e-book access is not allowed.",
  });
});

const persistentThumbnailDirectory = path.join(
  process.env.HOME || "/home/u822452811",
  "storage",
  "course-thumbnails",
);

app.use(
  "/assets/course-thumbnails",
  express.static(persistentThumbnailDirectory),
);
app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.use(express.static(path.join(__dirname, "frontend")));
// const PORT = 5000;
const PORT = process.env.PORT || 5000;
connectDB();

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/ebook-purchases", ebookPurchaseRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/categories", categoryRoutes);
app.get("/api/coupons/test-server", function (req, res) {
  res.json({
    success: true,
    message: "Coupon test route from server.js is working",
  });
});

const frontendPath = path.join(__dirname, "frontend");

console.log("Backend directory:", __dirname);
console.log("Frontend directory:", frontendPath);
console.log(
  "Frontend exists:",
  require("fs").existsSync(path.join(frontendPath, "index.html")),
);

app.use(express.static(frontendPath));

app.get("/", function (req, res) {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, function () {
  console.log(`Server running on http://localhost:${PORT}`);
});
