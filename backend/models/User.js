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

    otpVerified: {
      type: Boolean,
      default: false,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },
    resetOtpResendAfter: {
      type: Date,
      default: null,
    },

    // Login OTP fields
    loginOtp: {
      type: String,
      default: "",
    },
    loginOtpExpires: {
      type: Date,
      default: null,
    },
    loginOtpAttempts: {
      type: Number,
      default: 0,
    },
    loginOtpResendAfter: {
      type: Date,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
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
