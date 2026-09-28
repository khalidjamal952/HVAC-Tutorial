const express = require("express");
const Razorpay = require("razorpay");

const router = express.Router();

// Razorpay Test Mode configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ========================================
// CREATE RAZORPAY ORDER
// ========================================

router.post("/create-order", async (req, res) => {
  try {
    const { amount, courseId, courseName } = req.body;

    if (!amount) {
      return res.status(400).json({
        message: "Amount is required.",
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `hvac_${Date.now()}`,
      notes: {
        courseId: courseId || "",
        courseName: courseName || "",
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
