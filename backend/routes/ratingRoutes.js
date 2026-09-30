const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const CourseRating = require("../models/CourseRating");
const Order = require("../models/Order");

const router = express.Router();

// ==========================================
// SUBMIT / UPDATE COURSE RATING
// ==========================================

router.post("/:courseId", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, review } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    // Check whether student purchased this course
    const order = await Order.findOne({
      user: req.user.userId,
      status: "Paid",
      "courses.id": courseId,
    });

    if (!order) {
      return res.status(403).json({
        message: "You can rate only courses you have purchased.",
      });
    }

    // Create or update rating
    const courseRating = await CourseRating.findOneAndUpdate(
      {
        user: req.user.userId,
        courseId: courseId,
      },
      {
        rating: Number(rating),
        review: review || "",
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      message: "Course rating submitted successfully.",
      rating: courseRating,
    });
  } catch (error) {
    console.error("Course Rating Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// ==========================================
// GET COURSE RATINGS
// ==========================================

router.get("/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    const ratings = await CourseRating.find({
      courseId: courseId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const totalRatings = ratings.length;

    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) / totalRatings
        : 0;

    res.status(200).json({
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings: totalRatings,
      ratings: ratings,
    });
  } catch (error) {
    console.error("Get Course Ratings Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

module.exports = router;
