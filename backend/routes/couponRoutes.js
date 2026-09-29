const express = require("express");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   GET AVAILABLE COUPONS - STUDENT
========================= */

router.get("/available/:courseId", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    const now = new Date();

    const coupons = await Coupon.find({
      active: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
      $or: [{ courseIds: { $size: 0 } }, { courseIds: courseId }],
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Available coupons fetched successfully.",
      coupons: coupons,
    });
  } catch (error) {
    console.error("Get Available Coupons Error:", error);

    res.status(500).json({
      message: "Unable to fetch available coupons.",
    });
  }
});
/* =========================
   GET ALL COUPONS - ADMIN
========================= */

router.get("/admin", adminAuthMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Coupons fetched successfully",
      coupons: coupons,
    });
  } catch (error) {
    console.error("Get Admin Coupons Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

/* =========================
   CREATE COUPON - ADMIN
========================= */

router.post("/admin", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      courseIds,
      active,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        message:
          "Code, discount type, discount value and expiry date are required.",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        message: "Invalid discount type.",
      });
    }

    const numericDiscount = Number(discountValue);

    if (isNaN(numericDiscount) || numericDiscount <= 0) {
      return res.status(400).json({
        message: "Discount value must be greater than 0.",
      });
    }

    if (discountType === "percentage" && numericDiscount > 100) {
      return res.status(400).json({
        message: "Percentage discount cannot exceed 100%.",
      });
    }

    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
    });

    if (existingCoupon) {
      return res.status(409).json({
        message: "Coupon code already exists.",
      });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      discountType: discountType,
      discountValue: numericDiscount,
      minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 0,
      maxDiscount:
        maxDiscount !== undefined && maxDiscount !== null && maxDiscount !== ""
          ? Number(maxDiscount)
          : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      usageLimit:
        usageLimit !== undefined && usageLimit !== null && usageLimit !== ""
          ? Number(usageLimit)
          : null,
      perUserLimit:
        perUserLimit !== undefined && perUserLimit !== ""
          ? Number(perUserLimit)
          : 1,
      courseIds: Array.isArray(courseIds) ? courseIds : [],
      active: active !== undefined ? Boolean(active) : true,
    });

    res.status(201).json({
      message: "Coupon created successfully",
      coupon: coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);

    res.status(500).json({
      message: "Unable to create coupon.",
    });
  }
});

/* =========================
   UPDATE COUPON - ADMIN
========================= */

router.put("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      courseIds,
      active,
    } = req.body;

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found.",
      });
    }

    if (code !== undefined) {
      coupon.code = code.trim().toUpperCase();
    }

    if (discountType !== undefined) {
      if (!["percentage", "fixed"].includes(discountType)) {
        return res.status(400).json({
          message: "Invalid discount type.",
        });
      }

      coupon.discountType = discountType;
    }

    if (discountValue !== undefined) {
      const numericDiscount = Number(discountValue);

      if (isNaN(numericDiscount) || numericDiscount <= 0) {
        return res.status(400).json({
          message: "Discount value must be greater than 0.",
        });
      }

      if (coupon.discountType === "percentage" && numericDiscount > 100) {
        return res.status(400).json({
          message: "Percentage discount cannot exceed 100%.",
        });
      }

      coupon.discountValue = numericDiscount;
    }

    if (minOrderAmount !== undefined) {
      coupon.minOrderAmount = Number(minOrderAmount);
    }

    if (maxDiscount !== undefined) {
      coupon.maxDiscount =
        maxDiscount === "" || maxDiscount === null ? null : Number(maxDiscount);
    }

    if (startDate !== undefined) {
      coupon.startDate = new Date(startDate);
    }

    if (expiryDate !== undefined) {
      coupon.expiryDate = new Date(expiryDate);
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit =
        usageLimit === "" || usageLimit === null ? null : Number(usageLimit);
    }

    if (perUserLimit !== undefined) {
      coupon.perUserLimit = Number(perUserLimit);
    }

    if (courseIds !== undefined) {
      coupon.courseIds = Array.isArray(courseIds) ? courseIds : [];
    }

    if (active !== undefined) {
      coupon.active = Boolean(active);
    }

    await coupon.save();

    res.status(200).json({
      message: "Coupon updated successfully",
      coupon: coupon,
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);

    res.status(500).json({
      message: "Unable to update coupon.",
    });
  }
});

/* =========================
   DELETE COUPON - ADMIN
========================= */

router.delete("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found.",
      });
    }

    res.status(200).json({
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);

    res.status(500).json({
      message: "Unable to delete coupon.",
    });
  }
});

/* =========================
   VALIDATE COUPON - STUDENT
========================= */

router.post("/validate", authMiddleware, async (req, res) => {
  try {
    const { code, amount, courseIds } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: "Coupon code is required.",
      });
    }

    const orderAmount = Number(amount);

    if (isNaN(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({
        valid: false,
        message: "Invalid order amount.",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const coupon = await Coupon.findOne({
      code: normalizedCode,
    });

    if (!coupon) {
      return res.status(404).json({
        valid: false,
        message: "Invalid coupon code.",
      });
    }

    /* =========================
         ACTIVE CHECK
      ========================== */

    if (!coupon.active) {
      return res.status(400).json({
        valid: false,
        message: "This coupon is inactive.",
      });
    }

    /* =========================
         DATE CHECK
      ========================== */

    const now = new Date();

    if (coupon.startDate && now < coupon.startDate) {
      return res.status(400).json({
        valid: false,
        message: "This coupon is not active yet.",
      });
    }

    if (coupon.expiryDate && now > coupon.expiryDate) {
      return res.status(400).json({
        valid: false,
        message: "This coupon has expired.",
      });
    }

    /* =========================
         MINIMUM ORDER CHECK
      ========================== */

    if (orderAmount < Number(coupon.minOrderAmount || 0)) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount is ₹${coupon.minOrderAmount}.`,
      });
    }

    /* =========================
         COURSE CHECK
      ========================== */

    const selectedCourseIds = Array.isArray(courseIds) ? courseIds : [];

    if (Array.isArray(coupon.courseIds) && coupon.courseIds.length > 0) {
      const applicable = selectedCourseIds.some(function (courseId) {
        return coupon.courseIds.includes(courseId);
      });

      if (!applicable) {
        return res.status(400).json({
          valid: false,
          message: "This coupon is not applicable to the selected course.",
        });
      }
    }

    /* =========================
         TOTAL USAGE LIMIT
      ========================== */

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        valid: false,
        message: "This coupon usage limit has been reached.",
      });
    }

    /* =========================
         PER USER LIMIT
      ========================== */

    const successfulStatuses = ["Paid", "Completed", "Success", "Successful"];

    const userCouponUsage = await Order.countDocuments({
      user: req.user.userId,

      couponCode: normalizedCode,

      status: {
        $in: successfulStatuses,
      },
    });

    if (userCouponUsage >= Number(coupon.perUserLimit || 1)) {
      return res.status(400).json({
        valid: false,
        message: "You have already used this coupon the maximum allowed times.",
      });
    }

    /* =========================
         CALCULATE DISCOUNT
      ========================== */

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (orderAmount * Number(coupon.discountValue)) / 100;

      if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    /* =========================
         SAFETY CHECK
      ========================== */

    discount = Math.min(discount, orderAmount);

    discount = Math.round(discount * 100) / 100;

    const finalAmount = Math.max(orderAmount - discount, 0);

    res.status(200).json({
      valid: true,
      message: "Coupon applied successfully.",

      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },

      originalTotal: orderAmount,

      discount: discount,

      finalAmount: finalAmount,
    });
  } catch (error) {
    console.error("Validate Coupon Error:", error);

    res.status(500).json({
      valid: false,
      message: "Unable to validate coupon.",
    });
  }
});
router.get("/test", function (req, res) {
  res.json({
    success: true,
    message: "Coupon routes are working",
  });
});

module.exports = router;
module.exports = router;
