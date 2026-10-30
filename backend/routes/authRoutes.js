const authMiddleware = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();
const crypto = require("crypto");

// Email transporter for login OTP and password reset
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

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

    // Generate a 6-digit login OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    user.loginOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.loginOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.loginOtpAttempts = 0;
    user.loginOtpResendAfter = new Date(Date.now() + 30 * 1000);

    await user.save();

    try {
      await transporter.sendMail({
        from: `"HVAC Tutorial" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your HVAC Tutorial Login OTP",
        text: `Hello ${user.name},

Your login verification OTP is: ${otp}

This OTP expires in 5 minutes. Do not share it with anyone.

If you did not request this login, please ignore this email.

HVAC Tutorial Support`,
      });
    } catch (emailError) {
      console.error("Login OTP Email Error:", emailError.message);

      user.loginOtp = "";
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      await user.save();

      return res.status(500).json({
        message: "Unable to send OTP email. Please try again later.",
      });
    }

    return res.status(200).json({
      message: "OTP sent to your registered email address.",
      otpRequired: true,
      email: user.email.replace(/^(.{2})[^@]*(@.*)$/, "$1***$2"),
    });
  } catch (error) {
    console.error("Login OTP Error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// ==========================================
// STUDENT LOGIN OTP VERIFICATION
// ==========================================

router.post("/verify-login-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    if (
      !user.loginOtp ||
      !user.loginOtpExpires ||
      user.loginOtpExpires <= new Date()
    ) {
      return res.status(400).json({
        message: "OTP has expired. Please login again.",
      });
    }

    if (user.loginOtpAttempts >= 5) {
      user.loginOtp = "";
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      await user.save();

      return res.status(429).json({
        message: "Too many incorrect attempts. Please login again.",
      });
    }

    const hashedOtp = crypto
      .createHash("sha256")
      .update(String(otp).trim())
      .digest("hex");

    if (hashedOtp !== user.loginOtp) {
      user.loginOtpAttempts += 1;
      await user.save();

      return res.status(400).json({
        message: "Incorrect OTP. Please try again.",
        attemptsRemaining: 5 - user.loginOtpAttempts,
      });
    }

    // OTP verified successfully
    user.loginOtp = "";
    user.loginOtpExpires = null;
    user.loginOtpAttempts = 0;

    // Create session only after OTP verification
    const sessionId = crypto.randomUUID();
    user.activeSessionId = sessionId;

    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        sessionId: sessionId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(200).json({
      message: "Login successful.",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login OTP Verification Error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// ==========================================
// RESEND LOGIN OTP
// ==========================================

router.post("/resend-login-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (
      !user ||
      !user.loginOtp ||
      !user.loginOtpExpires ||
      user.loginOtpExpires <= new Date()
    ) {
      return res.status(400).json({
        message: "Please login again to request a new OTP.",
      });
    }

    const now = new Date();

    // Check resend cooldown
    if (user.loginOtpResendAfter && user.loginOtpResendAfter > now) {
      const remainingSeconds = Math.ceil(
        (user.loginOtpResendAfter - now) / 1000,
      );

      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        remainingSeconds,
      });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    user.loginOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.loginOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.loginOtpAttempts = 0;
    user.loginOtpResendAfter = new Date(Date.now() + 30 * 1000);

    await user.save();

    try {
      await transporter.sendMail({
        from: `"HVAC Tutorial" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your New HVAC Tutorial Login OTP",
        text: `Hello ${user.name},

Your new login verification OTP is: ${otp}

This OTP expires in 5 minutes. Do not share it with anyone.

HVAC Tutorial Support`,
      });
    } catch (emailError) {
      console.error("Resend OTP Email Error:", emailError.message);

      user.loginOtp = "";
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      user.loginOtpResendAfter = null;

      await user.save();

      return res.status(500).json({
        message: "Unable to resend OTP. Please try again later.",
      });
    }

    return res.status(200).json({
      message: "A new OTP has been sent to your registered email.",
    });
  } catch (error) {
    console.error("Resend Login OTP Error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// ==========================================
// STUDENT FORGOT PASSWORD - SEND OTP
// ==========================================

router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    // Same response whether email exists or not
    const successMessage =
      "If this email is registered, a password reset OTP has been sent.";

    if (!user) {
      return res.status(200).json({
        message: successMessage,
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store hashed OTP
    user.otp = crypto.createHash("sha256").update(otp).digest("hex");

    // OTP validity: 5 minutes
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otpVerified = false;
    user.resetOtpAttempts = 0;

    // Resend cooldown: 30 seconds
    user.resetOtpResendAfter = new Date(Date.now() + 30 * 1000);

    await user.save();

    try {
      await transporter.sendMail({
        from: `"HVAC Tutorial" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your HVAC Tutorial Password Reset OTP",
        text: `Hello ${user.name},

Your password reset OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

If you did not request a password reset, please ignore this email.

HVAC Tutorial Support`,
      });
    } catch (emailError) {
      console.error("Password Reset OTP Email Error:", emailError.message);

      user.otp = "";
      user.otpExpires = null;
      user.otpVerified = false;
      user.resetOtpAttempts = 0;
      user.resetOtpResendAfter = null;

      await user.save();

      return res.status(500).json({
        message: "Unable to send OTP. Please try again later.",
      });
    }

    return res.status(200).json({
      message: successMessage,
    });
  } catch (error) {
    console.error("Student Forgot Password Error:", error);

    return res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// VERIFY PASSWORD RESET OTP
// ==========================================

router.post("/verify-reset-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        message: "Please enter a valid 6-digit OTP.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    // Check OTP availability and expiry
    if (!user.otp || !user.otpExpires || user.otpExpires <= new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Maximum 5 attempts
    if (user.resetOtpAttempts >= 5) {
      user.otp = "";
      user.otpExpires = null;
      user.otpVerified = false;
      user.resetOtpAttempts = 0;

      await user.save();

      return res.status(429).json({
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // Hash entered OTP
    const hashedOtp = crypto
      .createHash("sha256")
      .update(String(otp))
      .digest("hex");

    if (hashedOtp !== user.otp) {
      user.resetOtpAttempts += 1;
      await user.save();

      return res.status(400).json({
        message: "Incorrect OTP. Please try again.",
        attemptsRemaining: 5 - user.resetOtpAttempts,
      });
    }

    // OTP verified successfully
    user.otpVerified = true;

    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully. You can now reset your password.",
      verified: true,
    });
  } catch (error) {
    console.error("Reset OTP Verification Error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// RESEND PASSWORD RESET OTP
router.post("/resend-reset-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (
      !user ||
      !user.otp ||
      !user.otpExpires ||
      user.otpExpires <= new Date()
    ) {
      return res.status(400).json({
        message: "OTP expired. Please request a new password reset.",
      });
    }

    // Check 30-second resend cooldown
    if (user.resetOtpResendAfter && user.resetOtpResendAfter > new Date()) {
      const remainingSeconds = Math.ceil(
        (user.resetOtpResendAfter - Date.now()) / 1000,
      );

      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
      });
    }

    // Generate new 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    user.otp = crypto.createHash("sha256").update(otp).digest("hex");
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.otpVerified = false;
    user.resetOtpAttempts = 0;
    user.resetOtpResendAfter = new Date(Date.now() + 30 * 1000);

    await user.save();

    try {
      await transporter.sendMail({
        from: `"HVAC Tutorial" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your New Password Reset OTP",
        text: `Hello ${user.name},

Your new password reset OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

If you did not request this OTP, please ignore this email.

HVAC Tutorial Support`,
      });
    } catch (emailError) {
      console.error("Resend Reset OTP Email Error:", emailError.message);

      user.otp = "";
      user.otpExpires = null;
      user.otpVerified = false;
      user.resetOtpAttempts = 0;
      user.resetOtpResendAfter = null;

      await user.save();

      return res.status(500).json({
        message: "Unable to resend OTP. Please try again later.",
      });
    }

    return res.status(200).json({
      message: "A new OTP has been sent to your registered email.",
    });
  } catch (error) {
    console.error("Resend Reset OTP Error:", error);

    return res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// STUDENT RESET PASSWORD USING VERIFIED OTP
// ==========================================

router.post("/reset-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and new password are required.",
      });
    }

    // Password validation
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid password reset request.",
      });
    }

    // OTP must be verified and still within its validity period
    if (
      user.otpVerified !== true ||
      !user.otp ||
      !user.otpExpires ||
      user.otpExpires <= new Date()
    ) {
      return res.status(400).json({
        message: "Please verify a valid OTP before resetting your password.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Clear password reset OTP data
    user.otp = "";
    user.otpExpires = null;
    user.otpVerified = false;
    user.resetOtpAttempts = 0;
    user.resetOtpResendAfter = null;

    // Invalidate existing student session
    user.activeSessionId = "";

    // Clear old reset token data
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully. Please login again.",
    });
  } catch (error) {
    console.error("Student Reset Password Error:", error);

    return res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// STUDENT LOGOUT
// ==========================================
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Clear active device session
    user.activeSessionId = null;
    await user.save();

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    res.status(500).json({
      message: "Server error",
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
