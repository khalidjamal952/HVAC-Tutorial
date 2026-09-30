const express = require("express");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const Order = require("../models/Order");
const User = require("../models/User");
const Razorpay = require("razorpay");
const Coupon = require("../models/Coupon");
const Course = require("../models/Course");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const router = express.Router();

// ========================================
// CREATE RAZORPAY ORDER
// ========================================

router.post("/razorpay/verify-payment", authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      courses,
      total,
      paymentMethod,
      couponCode,
    } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification details are required.",
      });
    }

    // =========================================
    // GET LOGGED-IN USER FROM DATABASE
    // =========================================

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    // =========================================
    // VERIFY RAZORPAY SIGNATURE
    // =========================================

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed.",
      });
    }
    // ========================================
    // VERIFY RAZORPAY ORDER AMOUNT
    // ========================================

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

    const expectedAmountPaise = Math.round(
      Number(razorpayOrder.notes?.finalAmount || 0) * 100,
    );

    if (!expectedAmountPaise) {
      return res.status(400).json({
        message: "Unable to verify order amount.",
      });
    }

    if (Number(razorpayOrder.amount) !== expectedAmountPaise) {
      return res.status(400).json({
        message: "Payment amount verification failed.",
      });
    }

    // ========================================
    // GET ACTUAL COURSES FROM DATABASE
    // ========================================

    const courseIdsFromNotes = (razorpayOrder.notes?.courseIds || "")
      .split(",")
      .map(function (id) {
        return id.trim();
      })
      .filter(Boolean);

    if (courseIdsFromNotes.length === 0) {
      return res.status(400).json({
        message: "Course information is missing.",
      });
    }

    const actualCourses = await Course.find({
      id: {
        $in: courseIdsFromNotes,
      },
    });

    if (actualCourses.length !== courseIdsFromNotes.length) {
      return res.status(400).json({
        message: "One or more purchased courses were not found.",
      });
    }

    const orderCourses = actualCourses.map(function (course) {
      return {
        id: course.id,
        title: course.title,
        price: Number(course.price || 0),
      };
    });

    // ========================================
    // PREVENT DUPLICATE PAYMENT VERIFICATION
    // ========================================

    const existingOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingOrder) {
      return res.status(200).json({
        message: "Payment already verified.",
        order: existingOrder,
      });
    }
    // =========================================
    // CREATE PAID ORDER
    // =========================================

    const order = await Order.create({
      user: req.user.userId,

      customer: {
        // IMPORTANT:
        // Name and email come from backend user account
        fullName: user.name,
        email: user.email,

        // Other checkout details can come from checkout form
        phone: customer?.phone || user.phone || "",
        city: customer?.city || user.city || "",
        address: customer?.address || "",
      },

      courses: orderCourses,

      originalTotal: Number(razorpayOrder.notes?.originalTotal || 0),

      discount: Number(razorpayOrder.notes?.discount || 0),

      couponCode: razorpayOrder.notes?.couponCode || "",

      total: Number(razorpayOrder.notes?.finalAmount || 0),

      paymentMethod: paymentMethod || "razorpay",

      razorpayOrderId: razorpay_order_id,

      razorpayPaymentId: razorpay_payment_id,

      razorpaySignature: razorpay_signature,

      status: "Paid",
    });

    // ========================================
    // UPDATE COURSE STUDENT COUNT
    // ========================================

    for (const course of orderCourses) {
      const alreadyPurchased = await Order.findOne({
        user: req.user.userId,
        status: "Paid",
        "courses.id": course.id,
        _id: { $ne: order._id },
      });

      if (!alreadyPurchased) {
        await Course.findOneAndUpdate(
          { id: course.id },
          {
            $inc: {
              students: 1,
            },
          },
        );
      }
    }
    // ========================================
    // INCREASE COUPON USAGE COUNT
    // ========================================

    if (razorpayOrder.notes?.couponCode) {
      await Coupon.findOneAndUpdate(
        {
          code: razorpayOrder.notes.couponCode,
        },
        {
          $inc: {
            usedCount: 1,
          },
        },
      );
    }

    res.status(200).json({
      message: "Payment verified and order created successfully.",

      order: order,
    });
  } catch (error) {
    console.error("Razorpay Payment Verification Error:", error);

    res.status(500).json({
      message: "Payment verification failed.",
    });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { customer, courses, total, paymentMethod } = req.body;

    if (
      !customer ||
      !courses ||
      courses.length === 0 ||
      total === undefined ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message: "Order details are required",
      });
    }

    const order = await Order.create({
      user: req.user.userId,
      customer,
      courses,
      total,
      paymentMethod,
    });

    res.status(201).json({
      message: "Order created successfully",
      order: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ========================================
// GET ALL ORDERS FOR ADMIN
// ========================================

router.get("/admin/all", adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "All orders fetched successfully",
      orders: orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// =========================================
// GET TOTAL REVENUE FOR ADMIN
// =========================================

router.get("/admin/revenue", adminAuthMiddleware, async (req, res) => {
  try {
    const paidOrders = await Order.find({
      status: {
        $in: ["Paid", "Completed", "Success", "Successful"],
      },
    });

    const totalRevenue = paidOrders.reduce(function (sum, order) {
      return sum + (Number(order.total) || 0);
    }, 0);

    res.status(200).json({
      message: "Revenue fetched successfully",
      totalRevenue: totalRevenue,
      paidOrders: paidOrders.length,
    });
  } catch (error) {
    console.error("Get Revenue Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// DELETE ORDER - ADMIN
// =========================================

router.delete("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Order deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Order Error:", error);

    res.status(500).json({
      message: "Unable to delete order.",
    });
  }
});

// =========================================
// GET LOGGED-IN USER ORDERS
// =========================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Orders fetched successfully",
      orders: orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// CHECK COURSE PURCHASE ACCESS
// =========================================

router.get("/access/:courseId", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const order = await Order.findOne({
      user: req.user.userId,

      status: {
        $in: ["Paid", "Completed", "Success", "Successful"],
      },

      "courses.id": courseId,
    });

    if (!order) {
      return res.status(403).json({
        access: false,
        message: "You have not purchased this course.",
      });
    }

    return res.status(200).json({
      access: true,
      message: "Course access granted.",
    });
  } catch (error) {
    console.error("Course Access Check Error:", error);

    res.status(500).json({
      access: false,
      message: "Unable to verify course access.",
    });
  }
});

// ========================================
// SYNC COURSE STUDENT COUNTS
// ========================================

router.post("/admin/sync-student-counts", adminAuthMiddleware, async (req, res) => {
  try {
    const courses = await Course.find();

    const paidOrders = await Order.find({
      status: {
        $in: ["Paid", "Completed", "Success", "Successful"],
      },
    });

    for (const course of courses) {
      const uniqueStudents = new Set();

      paidOrders.forEach(function (order) {
        const hasCourse = order.courses.some(function (purchasedCourse) {
          return purchasedCourse.id === course.id;
        });

        if (hasCourse) {
          uniqueStudents.add(String(order.user));
        }
      });

      await Course.findOneAndUpdate(
        { id: course.id },
        {
          $set: {
            students: uniqueStudents.size,
          },
        }
      );
    }

    res.status(200).json({
      message: "Course student counts synced successfully.",
    });
  } catch (error) {
    console.error("Sync Student Counts Error:", error);

    res.status(500).json({
      message: "Unable to sync course student counts.",
    });
  }
});
module.exports = router;
