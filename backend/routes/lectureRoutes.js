const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Lecture = require("../models/Lecture");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =========================
// VIDEO UPLOAD DIRECTORY
// =========================

const videoDirectory = path.join(
  __dirname,
  "../../assets/videos"
);

if (!fs.existsSync(videoDirectory)) {
  fs.mkdirSync(videoDirectory, {
    recursive: true,
  });
}

// =========================
// MULTER STORAGE
// =========================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videoDirectory);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);

    const fileName =
      "lecture-" +
      Date.now() +
      extension;

    cb(null, fileName);
  },
});

// =========================
// VIDEO FILE FILTER
// =========================

const fileFilter = function (req, file, cb) {
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only MP4, WebM, OGG and MOV video files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

// =========================
// GET ALL LECTURES - ADMIN
// =========================

router.get(
  "/admin",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const lectures = await Lecture.find().sort({
        courseId: 1,
        number: 1,
      });

      res.status(200).json({
        message: "Lectures fetched successfully",
        lectures: lectures,
      });
    } catch (error) {
      console.error("Get Admin Lectures Error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// ADD LECTURE WITH VIDEO
// =========================

router.post(
  "/",
  adminAuthMiddleware,
  upload.single("video"),
  async (req, res) => {
    try {
      const {
        courseId,
        number,
        title,
      } = req.body;

      if (!courseId || !number || !title) {
        return res.status(400).json({
          message:
            "Course, lecture number and title are required.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Video file is required.",
        });
      }

      const lecture = await Lecture.create({
        lectureId: "LECTURE" + Date.now(),
        courseId: courseId,
        number: Number(number),
        title: title.trim(),
        video:
          "/assets/videos/" +
          req.file.filename,
      });

      res.status(201).json({
        message: "Lecture added successfully",
        lecture: lecture,
      });
    } catch (error) {
      console.error("Add Lecture Error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// GET COURSE LECTURES
// =========================

router.get(
  "/course/:courseId",
  authMiddleware,
  async (req, res) => {
    try {
      const lectures = await Lecture.find({
        courseId: req.params.courseId,
      }).sort({
        number: 1,
      });

      res.status(200).json({
        message: "Course lectures fetched successfully",
        lectures: lectures,
      });
    } catch (error) {
      console.error(
        "Get Course Lectures Error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;