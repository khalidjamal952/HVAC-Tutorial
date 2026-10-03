const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const authMiddleware = require("../middleware/authMiddleware");

const Ebook = require("../models/Ebook");
const EbookPurchase = require("../models/EbookPurchase");

const router = express.Router();

// ========================================
// RAZORPAY CONFIGURATION
// ========================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ========================================
// CREATE E-BOOK RAZORPAY ORDER
// ========================================

router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { ebookId } = req.body;

    if (!ebookId) {
      return res.status(400).json({
        message: "E-Book ID is required.",
      });
    }

    const ebook = await Ebook.findById(ebookId);

    if (!ebook) {
      return res.status(404).json({
        message: "E-Book not found.",
      });
    }

    if (ebook.status !== "Active") {
      return res.status(400).json({
        message: "This E-Book is not available.",
      });
    }

    const price = Number(ebook.price || 0);

    if (price <= 0) {
      return res.status(400).json({
        message: "This E-Book has an invalid price.",
      });
    }

    // ========================================
    // CHECK EXISTING PURCHASE
    // ========================================

    const existingPurchase = await EbookPurchase.findOne({
      user: req.user.userId,
      ebook: ebook._id,
      paymentStatus: "Paid",
    });

    if (existingPurchase) {
      return res.status(400).json({
        message: "You have already purchased this E-Book.",
      });
    }

    // ========================================
    // CREATE RAZORPAY ORDER
    // ========================================

    const options = {
      amount: Math.round(price * 100),
      currency: "INR",
      receipt: `ebook_${Date.now()}`,
      notes: {
        ebookId: ebook._id.toString(),
        ebookTitle: ebook.title,
        finalAmount: String(price),
      },
    };

    const order = await razorpay.orders.create(options);

    // ========================================
    // CREATE PENDING PURCHASE
    // ========================================

    await EbookPurchase.create({
      user: req.user.userId,
      ebook: ebook._id,
      amount: price,
      razorpayOrderId: order.id,
      paymentStatus: "Pending",
    });

    res.status(200).json({
      message: "E-Book Razorpay order created successfully.",
      order: order,
      ebook: {
        id: ebook._id,
        title: ebook.title,
        price: price,
      },
    });
  } catch (error) {
    console.error("E-Book Create Order Error:", error);

    res.status(500).json({
      message: "Unable to create E-Book payment order.",
    });
  }
});

// ========================================
// VERIFY E-BOOK PAYMENT
// ========================================

router.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification details are required.",
      });
    }

    // ========================================
    // VERIFY RAZORPAY SIGNATURE
    // ========================================

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
    // FIND PURCHASE
    // ========================================

    const purchase = await EbookPurchase.findOne({
      user: req.user.userId,
      razorpayOrderId: razorpay_order_id,
    });

    if (!purchase) {
      return res.status(404).json({
        message: "E-Book purchase record not found.",
      });
    }

    // ========================================
    // VERIFY RAZORPAY ORDER AMOUNT
    // ========================================

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

    const expectedAmountPaise = Math.round(Number(purchase.amount) * 100);

    if (Number(razorpayOrder.amount) !== expectedAmountPaise) {
      return res.status(400).json({
        message: "Payment amount verification failed.",
      });
    }

    // ========================================
    // PREVENT DUPLICATE VERIFICATION
    // ========================================

    if (purchase.paymentStatus === "Paid") {
      return res.status(200).json({
        message: "Payment already verified.",
        purchase: purchase,
      });
    }

    // ========================================
    // MARK PURCHASE AS PAID
    // ========================================

    purchase.razorpayPaymentId = razorpay_payment_id;
    purchase.paymentStatus = "Paid";

    await purchase.save();

    res.status(200).json({
      message: "E-Book payment verified successfully.",
      purchase: purchase,
    });
  } catch (error) {
    console.error("E-Book Payment Verification Error:", error);

    res.status(500).json({
      message: "E-Book payment verification failed.",
    });
  }
});

// ========================================
// SECURE E-BOOK DOWNLOAD
// ========================================

router.get("/:ebookId/download", authMiddleware, async (req, res) => {
  try {
    const purchase = await EbookPurchase.findOne({
      user: req.user.userId,
      ebook: req.params.ebookId,
      paymentStatus: "Paid",
    });

    if (!purchase) {
      return res.status(403).json({
        message: "Please purchase this E-Book first.",
      });
    }

    const ebook = await Ebook.findById(req.params.ebookId);

    if (!ebook) {
      return res.status(404).json({
        message: "E-Book not found.",
      });
    }

    const filePath = path.join(
      __dirname,
      "../..",
      ebook.filePath.replace("/assets/", "assets/")
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "E-Book PDF file not found.",
      });
    }

    return res.download(
      filePath,
      ebook.fileName || `${ebook.title}.pdf`
    );
  } catch (error) {
    console.error("E-Book Download Error:", error);

    return res.status(500).json({
      message: "Unable to download E-Book.",
    });
  }
});
// ========================================
// CHECK E-BOOK PURCHASE
// ========================================

router.get("/:ebookId/purchased", authMiddleware, async (req, res) => {
  try {
    const purchase = await EbookPurchase.findOne({
      user: req.user.userId,
      ebook: req.params.ebookId,
      paymentStatus: "Paid",
    });

    res.status(200).json({
      purchased: !!purchase,
    });
  } catch (error) {
    console.error("Check E-Book Purchase Error:", error);

    res.status(500).json({
      message: "Unable to check E-Book purchase.",
    });
  }
});

module.exports = router;
