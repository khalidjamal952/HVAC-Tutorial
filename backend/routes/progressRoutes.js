const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const Lecture = require("../models/Lecture");

const router = express.Router();

// =========================================
// SAVE / UPDATE PROGRESS
// =========================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { courseId, completedLectures, currentLecture, videoPositions } =
      req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required.",
      });
    }

    if (!Array.isArray(completedLectures)) {
      return res.status(400).json({
        message: "Completed lectures must be an array.",
      });
    }

    // =====================================
    // GET COURSE
    // =====================================

    const course = await Course.findOne({
      id: courseId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    // =====================================
    // TOTAL LECTURES
    // =====================================

    const totalLectures = await Lecture.countDocuments({
      courseId: courseId,
    });

    // =====================================
    // CLEAN COMPLETED LECTURES
    // =====================================

    const validCompletedLectures = [
      ...new Set(
        completedLectures
          .map(function (index) {
            return Number(index);
          })
          .filter(function (index) {
            return (
              Number.isInteger(index) && index >= 0 && index < totalLectures
            );
          }),
      ),
    ];

    // =====================================
    // CALCULATE PROGRESS
    // =====================================

    const calculatedProgress =
      totalLectures === 0
        ? 0
        : Math.min(
            Math.round((validCompletedLectures.length / totalLectures) * 100),
            100,
          );

    // =====================================
    // SAVE / UPDATE MONGODB
    // =====================================

    const progress = await Progress.findOneAndUpdate(
      {
        user: req.user.userId,
        courseId: courseId,
      },
      {
        $set: {
          completedLectures: validCompletedLectures,

          progress: calculatedProgress,

          currentLecture: Number.isInteger(Number(currentLecture))
            ? Number(currentLecture)
            : 0,

          videoPositions:
            videoPositions && typeof videoPositions === "object"
              ? videoPositions
              : {},
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      message: "Progress saved successfully.",
      progress: progress,
    });
  } catch (error) {
    console.error("Save Progress Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================================
// GET PROGRESS FOR ONE COURSE
// =========================================

router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.userId,
      courseId: req.params.courseId,
    });

    res.status(200).json({
      message: "Progress fetched successfully.",
      progress: progress || null,
    });
  } catch (error) {
    console.error("Get Progress Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
