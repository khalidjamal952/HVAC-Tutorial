const express = require("express");
const Order = require("../models/Order");
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
    fileSize: 1536 * 1024 * 1024,
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
// PROTECTED VIDEO STREAM
// =========================
router.get(
  "/video/:lectureId",
  authMiddleware,
  async (req, res) => {
    try {
      const lecture = await Lecture.findOne({
        lectureId: req.params.lectureId,
      });

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found.",
        });
      }

      // Check whether user purchased this course
      const order = await Order.findOne({
        user: req.user.userId,
        status: {
          $in: [
            "Paid",
            "Completed",
            "Success",
            "Successful",
          ],
        },
        "courses.id": lecture.courseId,
      });

      if (!order) {
        return res.status(403).json({
          message: "You have not purchased this course.",
        });
      }

      // Get only the filename from stored video path
      const fileName = path.basename(lecture.video);

      const filePath = path.join(
        videoDirectory,
        fileName
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "Video file not found.",
        });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // =========================
      // RANGE REQUEST
      // =========================
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
          ? parseInt(parts[1], 10)
          : fileSize - 1;

        if (
          isNaN(start) ||
          start >= fileSize ||
          end >= fileSize
        ) {
          return res.status(416).json({
            message: "Invalid video range.",
          });
        }

        const chunkSize = end - start + 1;

        const stream = fs.createReadStream(filePath, {
          start,
          end,
        });

        res.writeHead(206, {
          "Content-Range":
            `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
        });

        stream.pipe(res);
        return;
      }

      // =========================
      // FULL VIDEO
      // =========================
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });

      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error(
        "Protected Video Error:",
        error
      );

      res.status(500).json({
        message: "Unable to load video.",
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

// =========================
// EDIT LECTURE - ADMIN
// =========================

router.put(
  "/:id",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const {
        courseId,
        number,
        title,
      } = req.body;

      const lecture = await Lecture.findById(
        req.params.id
      );

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found.",
        });
      }

      lecture.courseId = courseId;
      lecture.number = Number(number);
      lecture.title = title.trim();

      await lecture.save();

      res.status(200).json({
        message: "Lecture updated successfully.",
        lecture: lecture,
      });
    } catch (error) {
      console.error(
        "Edit Lecture Error:",
        error
      );

      res.status(500).json({
        message: "Unable to update lecture.",
      });
    }
  }
);
// =========================
// DELETE LECTURE - ADMIN
// =========================
router.delete(
  "/:id",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const lecture = await Lecture.findById(
        req.params.id
      );

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found.",
        });
      }

      // =========================
      // DELETE VIDEO FILE
      // =========================
      if (lecture.video) {
        const fileName = path.basename(
          lecture.video
        );

        const filePath = path.join(
          videoDirectory,
          fileName
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);

          console.log(
            "Video file deleted:",
            fileName
          );
        }
      }

      // =========================
      // DELETE MONGODB RECORD
      // =========================
      await Lecture.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        message:
          "Lecture and video deleted successfully.",
      });

    } catch (error) {
      console.error(
        "Delete Lecture Error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to delete lecture.",
      });
    }
  }
);
module.exports = router;