const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Order = require("../models/Order");

const router = express.Router();

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

module.exports = router;
