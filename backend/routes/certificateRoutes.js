const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Certificate = require("../models/Certificate");

const router = express.Router();

// =========================================
// CREATE CERTIFICATE
// =========================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { certificateId, courseId, courseName, completionDate } = req.body;

    if (!certificateId || !courseId || !courseName) {
      return res.status(400).json({
        message: "Certificate details are required",
      });
    }

    const existingCertificate = await Certificate.findOne({
      certificateId: certificateId,
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
