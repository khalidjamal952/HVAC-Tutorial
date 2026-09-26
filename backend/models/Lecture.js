const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
  {
    lectureId: {
      type: String,
      required: true,
      unique: true,
    },

    courseId: {
      type: String,
      required: true,
    },

    number: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    video: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Lecture = mongoose.model("Lecture", lectureSchema);

module.exports = Lecture;