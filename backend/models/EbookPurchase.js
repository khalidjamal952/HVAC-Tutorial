const mongoose = require("mongoose");

const ebookPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    razorpayOrderId: {
      type: String,
      required: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

ebookPurchaseSchema.index({ user: 1, ebook: 1 }, { unique: true });

const EbookPurchase = mongoose.model("EbookPurchase", ebookPurchaseSchema);

module.exports = EbookPurchase;
