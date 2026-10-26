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
    description: {
      type: String,
      default: "",
    },
    video: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Lecture = mongoose.model("Lecture", lectureSchema);

module.exports = Lecture;
