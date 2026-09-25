require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const progressRoutes = require("./routes/progressRoutes");
const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const certificateRoutes =
    require("./routes/certificateRoutes");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
connectDB();

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes);

app.get("/", function (req, res) {
  res.send("HVAC Tutorial Backend is Running!");
});

app.listen(PORT, function () {
  console.log(`Server running on http://localhost:${PORT}`);
});
