const mongoose = require("mongoose");

const ebookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: "PDF",
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    fileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    supportDocuments: [
      {
        fileName: {
          type: String,
          required: true
        },
        filePath: {
          type: String,
          required: true
        },
        relativePath: {
          type: String,
          default: ""
        },
        mimeType: {
          type: String,
          default: "application/pdf"
        },
        size: {
          type: Number,
          default: 0
        }
      }
    ],

    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ebook", ebookSchema);