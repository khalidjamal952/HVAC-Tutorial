const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: String,
      required: true,
    },

    courseName: {
      type: String,
      required: true,
    },

    completionDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      default: "Valid",
    },
  },
  {
    timestamps: true,
  },
);

const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = Certificate;
