const express = require("express");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const Order = require("../models/Order");
const User = require("../models/User");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const router = express.Router();

// ========================================
// CREATE RAZORPAY ORDER
// ========================================
router.post(
  "/razorpay/verify-payment",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        customer,
        courses,
        total,
        paymentMethod,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
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
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          razorpay_order_id +
            "|" +
            razorpay_payment_id
        )
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          message: "Payment verification failed.",
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

        courses: Array.isArray(courses)
          ? courses
          : [],

        total: Number(total) || 0,

        paymentMethod: paymentMethod || "razorpay",

        razorpayOrderId: razorpay_order_id,

        razorpayPaymentId: razorpay_payment_id,

        razorpaySignature: razorpay_signature,

        status: "Paid",
      });

      res.status(200).json({
        message:
          "Payment verified and order created successfully.",

        order: order,
      });
    } catch (error) {
      console.error(
        "Razorpay Payment Verification Error:",
        error
      );

      res.status(500).json({
        message: "Payment verification failed.",
      });
    }
  }
);

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

router.get(
  "/admin/all",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .sort({
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
  }
);
// =========================================
// GET TOTAL REVENUE FOR ADMIN
// =========================================



router.get(
  "/admin/revenue",
  adminAuthMiddleware,
  async (req, res) => {
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
  }
);

// =========================================
// GET LOGGED-IN USER ORDERS
// =========================================

router.get("/", authMiddleware, async (req, res) => {

    try {

        const orders = await Order.find({
            user: req.user.userId
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            message: "Orders fetched successfully",
            orders: orders
        });

    } catch (error) {

        console.error("Get Orders Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// =========================================
// CHECK COURSE PURCHASE ACCESS
// =========================================

router.get(
  "/access/:courseId",
  authMiddleware,
  async (req, res) => {
    try {
      const courseId = req.params.courseId;

      const order = await Order.findOne({
        user: req.user.userId,

        status: {
          $in: [
            "Paid",
            "Completed",
            "Success",
            "Successful",
          ],
        },

        "courses.id": courseId,
      });

      if (!order) {
        return res.status(403).json({
          access: false,
          message:
            "You have not purchased this course.",
        });
      }

      return res.status(200).json({
        access: true,
        message: "Course access granted.",
      });
    } catch (error) {
      console.error(
        "Course Access Check Error:",
        error
      );

      res.status(500).json({
        access: false,
        message: "Unable to verify course access.",
      });
    }
  }
);
module.exports = router;
