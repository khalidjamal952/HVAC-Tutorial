const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    lessons: {
      type: Number,
      required: true,
      default: 0,
    },

    duration: {
      type: String,
      required: true,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    originalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    students: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;