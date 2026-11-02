const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const Lecture = require("../models/Lecture");
const Order = require("../models/Order");

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
    // CHECK COURSE PURCHASE
    const order = await Order.findOne({
      user: req.user.userId,
      status: {
        $in: ["Paid", "Completed", "Success", "Successful", "Migrated"],
      },
      "courses.id": courseId,
    }).select("_id");

    // Free users can save progress only for first two lectures.
    const allowedLectureCount = order
      ? totalLectures
      : Math.min(totalLectures, 2);

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
              Number.isInteger(index) && index >= 0 && index < allowedLectureCount
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
    // SANITIZE CURRENT LECTURE AND VIDEO POSITIONS
    const requestedLecture = Number(currentLecture);

    const safeCurrentLecture =
      Number.isInteger(requestedLecture) &&
      requestedLecture >= 0 &&
      requestedLecture < allowedLectureCount
        ? requestedLecture
        : 0;

    const safeVideoPositions = {};

    if (videoPositions && typeof videoPositions === "object" && !Array.isArray(videoPositions)) {
      Object.entries(videoPositions).forEach(([key, value]) => {
        const index = Number(key);
        const position = Number(value);

        if (
          Number.isInteger(index) &&
          index >= 0 &&
          index < allowedLectureCount &&
          Number.isFinite(position) &&
          position >= 0
        ) {
          safeVideoPositions[index] = position;
        }
      });
    }
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

          currentLecture: safeCurrentLecture,

          videoPositions:
            safeVideoPositions,
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

    if (!progress) {
      return res.status(200).json({
        message: "Progress fetched successfully.",
        progress: null,
      });
    }

    const order = await Order.findOne({
      user: req.user.userId,
      status: { $in: ["Paid", "Completed", "Success", "Successful", "Migrated"] },
      "courses.id": req.params.courseId,
    }).select("_id");

    const responseProgress = progress.toObject({ flattenMaps: true });

    if (!order) {
      responseProgress.completedLectures =
        (responseProgress.completedLectures || []).filter(
          (index) => Number.isInteger(index) && index >= 0 && index < 2
        );

      responseProgress.currentLecture =
        Number.isInteger(responseProgress.currentLecture) &&
        responseProgress.currentLecture >= 0 &&
        responseProgress.currentLecture < 2
          ? responseProgress.currentLecture
          : 0;

      const positions = responseProgress.videoPositions || {};
      responseProgress.videoPositions = Object.fromEntries(
        Object.entries(positions).filter(([key, value]) => {
          const index = Number(key);
          const position = Number(value);
          return (
            Number.isInteger(index) &&
            index >= 0 &&
            index < 2 &&
            Number.isFinite(position) &&
            position >= 0
          );
        })
      );
    }

    res.status(200).json({
      message: "Progress fetched successfully.",
      progress: responseProgress,
    });
  } catch (error) {
    console.error("Get Progress Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
