const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Progress = require("../models/Progress");

const router = express.Router();

// =========================================
// SAVE / UPDATE COURSE PROGRESS
// =========================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      courseId,
      completedLectures,
      progress,
      currentLecture,
      videoPositions,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    const updatedProgress = await Progress.findOneAndUpdate(
      {
        user: req.user.userId,
        courseId: courseId,
      },

      {
        user: req.user.userId,
        courseId: courseId,
        completedLectures: completedLectures || [],
        progress: progress || 0,
        currentLecture: currentLecture || 0,
        videoPositions: videoPositions || {},
      },

      {
        new: true,
        upsert: true,
      },
    );

    res.status(200).json({
      message: "Course progress saved successfully",

      progress: updatedProgress,
    });
  } catch (error) {
    console.error("Save Progress Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// GET USER COURSE PROGRESS
// =========================================

router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.userId,

      courseId: req.params.courseId,
    });

    if (!progress) {
      return res.status(200).json({
        progress: {
          courseId: req.params.courseId,

          completedLectures: [],

          progress: 0,

          currentLecture: 0,
        },
      });
    }

    res.status(200).json({
      progress: progress,
    });
  } catch (error) {
    console.error("Get Progress Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
