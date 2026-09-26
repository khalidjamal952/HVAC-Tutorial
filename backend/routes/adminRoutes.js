const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// ==========================================
// ADMIN REGISTER / FIRST-TIME SETUP
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const existingAdmin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingAdmin) {
      return res.status(409).json({
        message: "Admin account already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin account created successfully.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Register Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// ADMIN LOGIN
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Admin login successful.",
      token: token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// GET CURRENT ADMIN
// ==========================================
router.get("/me", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId).select(
      "-password"
    );

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found.",
      });
    }

    res.status(200).json({
      admin: admin,
    });
  } catch (error) {
    console.error("Get Admin Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// ADMIN FORGOT PASSWORD
// ==========================================

const crypto = require("crypto");

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Admin email is required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    // Same response whether email exists or not
    // This prevents exposing whether an admin account exists.
    if (!admin) {
      return res.status(200).json({
        message:
          "If this email is registered, a password reset link has been generated.",
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Token expires in 15 minutes
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await admin.save();

    const resetUrl =
      "http://localhost:5500/pages/admin-reset-password.html?token=" +
      resetToken;

    // Development testing only
    console.log("=================================");
    console.log("ADMIN PASSWORD RESET URL:");
    console.log(resetUrl);
    console.log("=================================");

    res.status(200).json({
      message:
        "Password reset link generated successfully.",
      resetUrl: resetUrl,
    });
  } catch (error) {
    console.error(
      "Admin Forgot Password Error:",
      error
    );

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// ADMIN RESET PASSWORD
// ==========================================

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message:
          "Reset token and new password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long.",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter.",
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one lowercase letter.",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one number.",
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one special character.",
      });
    }

    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!admin) {
      return res.status(400).json({
        message:
          "Invalid or expired password reset link.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    admin.password = hashedPassword;

    admin.resetPasswordToken = "";
    admin.resetPasswordExpires = null;

    await admin.save();

    res.status(200).json({
      message:
        "Admin password reset successfully.",
    });
  } catch (error) {
    console.error(
      "Admin Reset Password Error:",
      error
    );

    res.status(500).json({
      message: "Server error.",
    });
  }
});
module.exports = router;