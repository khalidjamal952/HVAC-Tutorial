const express = require("express");
const Razorpay = require("razorpay");
const Coupon = require("../models/Coupon");
const authMiddleware = require("../middleware/authMiddleware");
const Course = require("../models/Course");
const Order = require("../models/Order");

const router = express.Router();

// Razorpay Test Mode configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ========================================
// CREATE RAZORPAY ORDER
// ========================================

router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { amount, courseId, courseName, couponCode, courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        message: "Course IDs are required.",
      });
    }

    const courses = await Course.find({
      id: { $in: courseIds },
    });

    if (courses.length !== courseIds.length) {
      return res.status(400).json({
        message: "One or more courses were not found.",
      });
    }

    const originalTotal = courses.reduce(function (sum, course) {
      return sum + Number(course.price || 0);
    }, 0);

    let finalAmount = originalTotal;

    let discount = 0;

    if (couponCode) {
      const normalizedCouponCode = couponCode.trim().toUpperCase();

      const coupon = await Coupon.findOne({
        code: normalizedCouponCode,
      });

      if (!coupon) {
        return res.status(400).json({
          message: "Invalid coupon code.",
        });
      }

      const now = new Date();

      if (!coupon.active) {
        return res.status(400).json({
          message: "This coupon is inactive.",
        });
      }

      if (now < coupon.startDate || now > coupon.expiryDate) {
        return res.status(400).json({
          message: "This coupon has expired or is not active yet.",
        });
      }

      if (originalTotal < Number(coupon.minOrderAmount || 0)) {
        return res.status(400).json({
          message: `Minimum order amount is ₹${coupon.minOrderAmount}.`,
        });
      }

      if (
        Array.isArray(coupon.courseIds) &&
        coupon.courseIds.length > 0 &&
        !courseIds.some(function (id) {
          return coupon.courseIds.includes(id);
        })
      ) {
        return res.status(400).json({
          message: "This coupon is not applicable to the selected course.",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          message: "This coupon usage limit has been reached.",
        });
      }

      const successfulStatuses = ["Paid", "Completed", "Success", "Successful"];

      const userCouponUsage = await Order.countDocuments({
        user: req.user.userId,
        couponCode: coupon.code,
        status: {
          $in: successfulStatuses,
        },
      });

      if (userCouponUsage >= Number(coupon.perUserLimit || 1)) {
        return res.status(400).json({
          message:
            "You have already used this coupon the maximum allowed times.",
        });
      }

      if (coupon.discountType === "percentage") {
        discount = (originalTotal * Number(coupon.discountValue)) / 100;
      } else {
        discount = Number(coupon.discountValue);
      }

      if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }

      discount = Math.min(discount, originalTotal);

      finalAmount = Math.max(originalTotal - discount, 0);
    }
    const options = {
      amount: Math.round(Number(finalAmount) * 100),
      currency: "INR",
      receipt: `hvac_${Date.now()}`,
     notes: {
  courseId: courseId || "",
  courseName: courseName || "",
  courseIds: courseIds.join(","),
  couponCode: couponCode
    ? couponCode.trim().toUpperCase()
    : "",
  originalTotal: String(originalTotal),
  discount: String(discount),
  finalAmount: String(finalAmount),
},
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      message: "Razorpay order created successfully.",
      order: order,
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);

    res.status(500).json({
      message: "Unable to create Razorpay order.",
    });
  }
});

module.exports = router;
