const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const User = require("../models/User");
const Course = require("../models/Course");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const router = express.Router();

// =========================================
// GET CURRENT USER PROFILE
// =========================================

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User profile fetched successfully",
      user: user,
    });
  } catch (error) {
    console.error("User Profile Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// UPDATE CURRENT USER PROFILE
// =========================================

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    user.phone = phone ? phone.trim() : "";
    user.city = city ? city.trim() : "";

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// =========================================
router.post("/admin/students", adminAuthMiddleware, async (req, res) => {
  let createdUser = null;
  let createdOrder = null;

  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const city = String(req.body.city || "").trim();
    const courseId = String(req.body.courseId || "").trim();

    if (!name || !email || !phone || !city || !courseId) {
      return res.status(400).json({
        message: "Name, email, phone, city and course are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A student with this email or phone already exists.",
      });
    }

    const course = await Course.findOne({ id: courseId }).lean();

    if (!course) {
      return res.status(404).json({
        message: "Selected course not found.",
      });
    }

    if (!process.env.FRONTEND_URL || !process.env.SMTP_USER) {
      return res.status(500).json({
        message: "Website URL or email configuration is missing.",
      });
    }

    const setupToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(setupToken)
      .digest("hex");

    const temporaryPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    createdUser = await User.create({
      name,
      email,
      phone,
      city,
      password: hashedPassword,
      passwordSetupTokenHash: tokenHash,
      passwordSetupExpires: new Date(Date.now() + 30 * 60 * 1000),
      passwordSetupRequired: true,
      otpVerified: false,
    });

    createdOrder = await Order.create({
      user: createdUser._id,
      customer: {
        fullName: name,
        email,
        phone,
        city,
        address: "Legacy WordPress purchase",
      },
      courses: [
        {
          id: course.id,
          title: course.title,
          price: Number(course.price) || 0,
        },
      ],
      originalTotal: 0,
      discount: 0,
      total: 0,
      paymentMethod: "WordPress Migration",
      status: "Migrated",
    });

    const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, "");

    const setupUrl =
      frontendUrl +
      "/pages/setup-password.html?token=" +
      encodeURIComponent(setupToken);

    await transporter.sendMail({
      from: '"HVAC Tutorial" <' + process.env.SMTP_USER + ">",
      to: email,
      subject: "Set Up Your HVAC Tutorial Student Account",
      text:
        "Hello " + name + ",\n\n" +
        "Your HVAC Tutorial student account has been created.\n\n" +
        "Set your password using this secure link:\n" +
        setupUrl +
        "\n\nThis link expires in 30 minutes and can only be used once.\n\n" +
        "HVAC Tutorial Support",
    });

    return res.status(201).json({
      message: "Student created and password setup email sent successfully.",
      student: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
      },
    });
  } catch (error) {
    console.error("Manual Student Creation Error:", error);

    if (createdOrder) {
      await Order.findByIdAndDelete(createdOrder._id).catch(console.error);
    }

    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id).catch(console.error);
    }

    return res.status(500).json({
      message: "Unable to create student or send setup email.",
    });
  }
});
// GET ALL STUDENTS - ADMIN
// =========================================

router.get(
  "/admin/students",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const students = await User.find()
        .select("-password")
        .sort({
          createdAt: -1,
        });

      res.status(200).json({
        message: "Students fetched successfully",
        students: students,
      });
    } catch (error) {
      console.error("Admin Students Error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================================
// DELETE STUDENT - ADMIN
// =========================================

router.delete(
  "/admin/students/:id",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const student = await User.findByIdAndDelete(
        req.params.id
      );

      if (!student) {
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      res.status(200).json({
        message: "Student deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Student Error:",
        error
      );

      res.status(500).json({
        message: "Unable to delete student.",
      });
    }
  }
);
module.exports = router;
