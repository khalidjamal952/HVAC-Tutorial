const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const Certificate = require("../models/Certificate");
const Progress = require("../models/Progress");
const Lecture = require("../models/Lecture");

const router = express.Router();

// =========================================
// CREATE CERTIFICATE
// =========================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { courseId, courseName, completionDate } = req.body;

    if (!courseId || !courseName) {
      return res.status(400).json({
        message: "Certificate details are required",
      });
    }

    const progress = await Progress.findOne({
      user: req.user.userId,
      courseId: courseId,
    });

    const totalLectures = await Lecture.countDocuments({
      courseId: courseId,
    });

    const completedLectures = progress ? progress.completedLectures.length : 0;

  
    if (!progress || totalLectures === 0 || completedLectures < totalLectures) {
      return res.status(400).json({
        message: "Complete the course before generating a certificate.",
      });
    }

    const certificateId = "HVAC-" + Date.now();

    const existingCertificate = await Certificate.findOne({
      user: req.user.userId,
      courseId: courseId,
    });

    if (existingCertificate) {
      return res.status(200).json({
        message: "Certificate already exists",
        certificate: existingCertificate,
      });
    }

    const certificate = await Certificate.create({
      certificateId,
      user: req.user.userId,
      courseId,
      courseName,
      completionDate: completionDate || new Date(),
      status: "Valid",
    });

    res.status(201).json({
      message: "Certificate created successfully",
      certificate: certificate,
    });
  } catch (error) {
    console.error("Create Certificate Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// GET MY CERTIFICATES
// =========================================

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const certificates = await Certificate.find({
      user: req.user.userId,
    })
      .populate("user", "name email")
      .sort({
        completionDate: -1,
      });

    // Send certificates to frontend
    res.status(200).json({
      certificates: certificates,
    });
  } catch (error) {
    console.error("Get My Certificates Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// =========================================
// GET ALL CERTIFICATES FOR ADMIN
// ONLY COMPLETED COURSES
// =========================================

router.get("/admin/all", adminAuthMiddleware, async (req, res) => {
  try {
    // Get only completed course progress
    const completedProgress = await Progress.find({
      progress: 100,
    }).select("user courseId");

    // Create unique user + course keys
    const completedCourseKeys = new Set();

    completedProgress.forEach(function (item) {
      completedCourseKeys.add(String(item.user) + "_" + String(item.courseId));
    });

    // Get certificates
    const allCertificates = await Certificate.find()
      .populate("user", "name email")
      .sort({
        completionDate: -1,
      });

    // Keep only certificates of completed courses
    const certificates = allCertificates.filter(function (certificate) {
      if (!certificate.user) {
        return false;
      }

      const key =
        String(certificate.user._id) + "_" + String(certificate.courseId);

      return completedCourseKeys.has(key);
    });

    res.status(200).json({
      message: "Completed course certificates fetched successfully",
      certificates: certificates,
    });
  } catch (error) {
    console.error("Get All Certificates Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// DELETE CERTIFICATE - ADMIN
// =========================================

router.delete("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found.",
      });
    }

    await Certificate.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Certificate deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Certificate Error:", error);

    res.status(500).json({
      message: "Unable to delete certificate.",
    });
  }
});
// =========================================
// VERIFY CERTIFICATE
// =========================================

router.get("/verify/:certificateId", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
    }).populate("user", "name email");

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      valid: true,
      message: "Certificate verified successfully",
      certificate: certificate,
    });
  } catch (error) {
    console.error("Verify Certificate Error:", error);

    res.status(500).json({
      valid: false,
      message: "Server error",
    });
  }
});

module.exports = router;
