const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      default: "",
    },

    otpExpires: {
      type: Date,
      default: null,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    activeSessionId: {
      type: String,
      default: "",
    },
    resetPasswordToken: {
      type: String,
      default: "",
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
