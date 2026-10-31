const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3, R2_BUCKET_NAME, isR2Configured } = require("../config/r2");

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

    await EbookPurchase.findOneAndUpdate(
      {
        user: req.user.userId,
        ebook: ebook._id,
      },
      {
        user: req.user.userId,
        ebook: ebook._id,
        amount: price,
        razorpayOrderId: order.id,
        paymentStatus: "Pending",
        razorpayPaymentId: "",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

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

    const fileName = path.basename(ebook.fileName || `${ebook.title}.pdf`);
    const isPdf = path.extname(fileName).toLowerCase() === ".pdf";
    const requestedDownload = req.query.action === "download";
    const disposition = isPdf && !requestedDownload ? "inline" : "attachment";
    const legacyAction = disposition === "inline" ? "read" : "download";

    // R2 STORAGE
    if (ebook.filePath.startsWith("ebooks/")) {
      if (!isR2Configured() || !s3) {
        return res.status(503).json({
          message: "Cloudflare R2 is not configured.",
        });
      }

      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: ebook.filePath,
        ResponseContentType: isPdf ? "application/pdf" : "application/octet-stream",
        ResponseContentDisposition: `${disposition}; filename="${fileName.replace(/["\\]/g, "_")}"`,
      });

      const url = await getSignedUrl(s3, command, {
        expiresIn: 600,
      });

      res.set("Cache-Control", "no-store");

      return res.status(200).json({
        success: true,
        url,
        fileName,
        expiresIn: 600,
      });
    }

    // LEGACY LOCAL STORAGE
    const filePath = path.join(
      __dirname,
      "../..",
      ebook.filePath.replace("/assets/", "assets/"),
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "E-Book PDF file not found.",
      });
    }

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      url: `${req.protocol}://${req.get("host")}/api/ebook-purchases/${ebook._id}/legacy-file?action=${legacyAction}`,
      fileName,
      legacy: true,
    });
  } catch (error) {
    console.error("E-Book Download Error:", error);

    return res.status(500).json({
      message: "Unable to access E-Book.",
    });
  }
});

// ========================================
// LEGACY LOCAL PDF DELIVERY
// ========================================

router.get("/:ebookId/legacy-file", authMiddleware, async (req, res) => {
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

    if (!ebook || !ebook.filePath.startsWith("/assets/ebooks/")) {
      return res.status(404).json({
        message: "Legacy E-Book not found.",
      });
    }

    const fileName = path.basename(ebook.fileName || `${ebook.title}.pdf`);
    const filePath = path.join(
      __dirname,
      "../..",
      "assets",
      "ebooks",
      path.basename(ebook.filePath),
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "E-Book PDF file not found.",
      });
    }

    res.set("Cache-Control", "no-store");

    const isPdf = path.extname(fileName).toLowerCase() === ".pdf";

    if (!isPdf || req.query.action === "download") {
      return res.download(filePath, fileName);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName.replace(/["\\]/g, "_")}"`);

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Legacy E-Book Delivery Error:", error);

    return res.status(500).json({
      message: "Unable to access E-Book.",
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





