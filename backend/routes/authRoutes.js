const authMiddleware = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();
const crypto = require("crypto");
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==========================================
// STUDENT FORGOT PASSWORD
// ==========================================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    // Same response whether email exists or not
    if (!user) {
      return res.status(200).json({
        message:
          "If this email is registered, a password reset link has been generated.",
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Token expires in 15 minutes
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl =
      "http://127.0.0.1:5500/frontend/pages/reset-password.html?token=" +
      resetToken;

    // Development testing only
    console.log("=================================");
    console.log("STUDENT PASSWORD RESET URL:");
    console.log(resetUrl);
    console.log("=================================");

    res.status(200).json({
      message: "Password reset link generated successfully.",
      resetUrl: resetUrl,
    });
  } catch (error) {
    console.error("Student Forgot Password Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// STUDENT RESET PASSWORD
// ==========================================

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Reset token and new password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain at least one uppercase letter.",
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain at least one lowercase letter.",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain at least one number.",
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain at least one special character.",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset link.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Student Reset Password Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Protected profile accessed successfully",
      user: user,
    });
  } catch (error) {
    console.error("Profile Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// ADMIN LOGIN
// =========================================

router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (
      email.trim().toLowerCase() !== adminEmail.toLowerCase() ||
      password !== adminPassword
    ) {
      return res.status(401).json({
        message: "Invalid admin email or password",
      });
    }

    const token = jwt.sign(
      {
        role: "admin",
        email: adminEmail,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      message: "Admin login successful",
      token: token,
      admin: {
        email: adminEmail,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
module.exports = router;
