const mongoose = require("mongoose");

const courseRatingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// One student can have only one rating for one course
courseRatingSchema.index({ user: 1, courseId: 1 }, { unique: true });

const CourseRating = mongoose.model("CourseRating", courseRatingSchema);

module.exports = CourseRating;
