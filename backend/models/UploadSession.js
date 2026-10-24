const mongoose = require("mongoose");

const uploadSessionSchema = new mongoose.Schema(
  {
    uploadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    key: {
      type: String,
      required: true,
      unique: true,
    },

    adminId: {
      type: String,
      required: true,
    },

    courseId: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["initiated", "completed", "aborted"],
      default: "initiated",
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UploadSession", uploadSessionSchema);
