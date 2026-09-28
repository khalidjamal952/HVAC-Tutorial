const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const User = require("../models/User");

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
