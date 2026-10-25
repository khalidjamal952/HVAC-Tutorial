const express = require("express");
const Order = require("../models/Order");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const Lecture = require("../models/Lecture");
const UploadSession = require("../models/UploadSession");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// CLOUDFLARE R2 CONFIGURATION
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

const R2_REGION = process.env.R2_REGION || "auto";

function isR2Configured() {
  return Boolean(
    R2_ENDPOINT && R2_BUCKET_NAME && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY,
  );
}

const s3 = isR2Configured()
  ? new S3Client({
      region: R2_REGION,
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

// R2 MULTIPART UPLOAD SETTINGS
const R2_MAX_VIDEO_SIZE = 50 * 1024 * 1024 * 1024; // 50 GB
const R2_PART_SIZE = 16 * 1024 * 1024; // 16 MB

function requireR2(res) {
  if (!isR2Configured() || !s3) {
    res.status(503).json({
      message: "Cloudflare R2 is not configured correctly.",
    });
    return false;
  }

  return true;
}

// INITIATE MULTIPART UPLOAD
router.post("/upload/initiate", adminAuthMiddleware, async (req, res) => {
  try {
    if (!requireR2(res)) return;

    const { fileName, contentType, fileSize, courseId } = req.body;

    if (!fileName || !contentType || !fileSize || !courseId) {
      return res.status(400).json({
        message: "File name, type, size and course are required.",
      });
    }

    const size = Number(fileSize);

    if (!Number.isSafeInteger(size) || size <= 0 || size > R2_MAX_VIDEO_SIZE) {
      return res.status(400).json({
        message: "Video size must be between 1 byte and 50 GB.",
      });
    }

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        message: "Unsupported video type.",
      });
    }

    const extension = path.extname(fileName).toLowerCase();

    const allowedExtensions = [".mp4", ".webm", ".ogg", ".mov"];

    if (!allowedExtensions.includes(extension)) {
      return res.status(400).json({
        message: "Unsupported video extension.",
      });
    }

    const key = `courses/${encodeURIComponent(String(courseId))}/videos/${Date.now()}-${require("crypto").randomUUID()}${extension}`;

    const result = await s3.send(
      new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Metadata: {
          originalname: path.basename(fileName).slice(0, 200),
        },
      }),
    );

    if (!result.UploadId) {
      return res.status(500).json({
        message: "R2 did not return an upload ID.",
      });
    }

    try {
      const adminId = String(
        req.user?.userId || req.user?._id || req.user?.id || "",
      );

      if (!adminId) {
        await s3.send(
          new AbortMultipartUploadCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            UploadId: result.UploadId,
          }),
        );

        return res.status(401).json({
          message: "Admin identity not found. Check adminAuthMiddleware.",
        });
      }

      await UploadSession.create({
        uploadId: result.UploadId,
        key,
        adminId,
        courseId: String(courseId),
        fileName: path.basename(fileName),
        contentType,
        fileSize: size,
        status: "initiated",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    } catch (dbError) {
      try {
        await s3.send(
          new AbortMultipartUploadCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            UploadId: result.UploadId,
          }),
        );
      } catch (abortError) {
        console.error("R2 Abort After Session Failure:", abortError);
      }

      throw dbError;
    }

    return res.status(200).json({
      message: "Multipart upload initiated.",
      uploadId: result.UploadId,
      key,
      partSize: R2_PART_SIZE,
    });
  } catch (error) {
    console.error("R2 Initiate Upload Error:", error);
    return res.status(500).json({
      message: "Unable to initiate video upload.",
    });
  }
});

/* GENERATE SIGNED URL FOR EACH PART */
router.post("/upload/sign-part", adminAuthMiddleware, async (req, res) => {
  try {
    if (!requireR2(res)) return;

    const { key, uploadId, partNumber } = req.body;
    const part = Number(partNumber);

    const adminId = String(
      req.user?.userId || req.user?._id || req.user?.id || "",
    );

    if (
      !adminId ||
      typeof key !== "string" ||
      typeof uploadId !== "string" ||
      !uploadId ||
      !Number.isInteger(part) ||
      part < 1 ||
      part > 10000
    ) {
      return res.status(400).json({
        message: "Invalid multipart upload details.",
      });
    }

    const session = await UploadSession.findOne({
      key,
      uploadId,
      adminId,
      status: "initiated",
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(403).json({
        message: "Upload session is invalid, expired, or unauthorized.",
      });
    }

    const url = await getSignedUrl(
      s3,
      new UploadPartCommand({
        Bucket: R2_BUCKET_NAME,
        Key: session.key,
        UploadId: session.uploadId,
        PartNumber: part,
      }),
      { expiresIn: 900 },
    );

    return res.json({ url });
  } catch (error) {
    console.error("R2 Sign Part Error:", error);

    return res.status(500).json({
      message: "Unable to generate upload URL.",
    });
  }
});

/* =========================
   COMPLETE MULTIPART UPLOAD
========================= */
router.post("/upload/complete", adminAuthMiddleware, async (req, res) => {
  try {
    if (!requireR2(res)) return;

    const { key, uploadId, parts, courseId, number, title, description } =
      req.body;

    const adminId = String(
      req.user?.userId || req.user?._id || req.user?.id || "",
    );

    // Validate lecture details
    if (
      !courseId ||
      number === undefined ||
      number === null ||
      String(number).trim() === "" ||
      !Number.isSafeInteger(Number(number)) ||
      Number(number) < 1 ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        message: "Valid course, lecture number and title are required.",
      });
    }

    // Validate upload details
    if (
      !adminId ||
      typeof key !== "string" ||
      typeof uploadId !== "string" ||
      !uploadId ||
      !Array.isArray(parts) ||
      parts.length === 0 ||
      parts.length > 10000
    ) {
      return res.status(400).json({
        message: "Invalid multipart completion details.",
      });
    }

    // Verify the upload session belongs to this admin
    const session = await UploadSession.findOne({
      key,
      uploadId,
      adminId,
      courseId: String(courseId),
      status: "initiated",
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(403).json({
        message: "Upload session is invalid, expired, or unauthorized.",
      });
    }

    // Validate expected number of parts
    const expectedParts = Math.ceil(session.fileSize / R2_PART_SIZE);

    if (parts.length !== expectedParts) {
      return res.status(400).json({
        message: "Uploaded parts count does not match file size.",
      });
    }
    // Validate part numbers and ETags
    const normalizedParts = parts.map((part) => ({
      PartNumber: Number(part.PartNumber),
      ETag: typeof part.ETag === "string" ? part.ETag : "",
    }));

    const validParts = normalizedParts.every(
      (part, index) =>
        Number.isInteger(part.PartNumber) &&
        part.PartNumber === index + 1 &&
        part.ETag.length > 0,
    );

    if (!validParts) {
      return res.status(400).json({
        message: "Invalid uploaded parts list.",
      });
    }

    // Complete multipart upload in R2
    const result = await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: session.key,
        UploadId: session.uploadId,
        MultipartUpload: {
          Parts: normalizedParts,
        },
      }),
    );

    // Create lecture record in MongoDB
    const lectureId =
      "LECTURE" + Date.now() + require("crypto").randomBytes(3).toString("hex");

    let lecture;

    try {
      lecture = await Lecture.create({
        lectureId,
        courseId: session.courseId,
        number: Number(number),
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
        video: session.key,
        thumbnail: "",
      });
    } catch (dbError) {
      // R2 upload succeeded but lecture record could not be saved.
      console.error("Lecture Save After R2 Completion Failed:", dbError);

      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: session.key,
          }),
        );
      } catch (cleanupError) {
        console.error("R2 Orphan Video Cleanup Failed:", cleanupError);
      }

      throw dbError;
    }

    // Mark session completed
    session.status = "completed";
    await session.save();

    return res.status(201).json({
      message: "Video uploaded and lecture saved successfully.",
      lecture,
      key: session.key,
      etag: result.ETag,
    });
  } catch (error) {
    console.error("R2 Complete Upload Error:", error);

    return res.status(500).json({
      message: "Unable to complete upload or save lecture.",
    });
  }
});

/* =========================
   ABORT MULTIPART UPLOAD
========================= */
router.post("/upload/abort", adminAuthMiddleware, async (req, res) => {
  try {
    if (!requireR2(res)) return;

    const { key, uploadId } = req.body;

    const adminId = String(
      req.user?.userId || req.user?._id || req.user?.id || "",
    );

    if (
      !adminId ||
      typeof key !== "string" ||
      typeof uploadId !== "string" ||
      !uploadId
    ) {
      return res.status(400).json({
        message: "Invalid multipart abort details.",
      });
    }

    // Verify that this upload belongs to the authenticated admin
    const session = await UploadSession.findOne({
      key,
      uploadId,
      adminId,
      status: "initiated",
    });

    if (!session) {
      return res.status(403).json({
        message: "Upload session is invalid or unauthorized.",
      });
    }

    await s3.send(
      new AbortMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: session.key,
        UploadId: session.uploadId,
      }),
    );

    session.status = "aborted";
    await session.save();

    return res.json({
      message: "Multipart upload aborted successfully.",
    });
  } catch (error) {
    console.error("R2 Abort Upload Error:", error);

    return res.status(500).json({
      message: "Unable to abort video upload.",
    });
  }
});

// =========================
// VIDEO UPLOAD DIRECTORY
// =========================

const videoDirectory = path.join(__dirname, "../../assets/videos");

if (!fs.existsSync(videoDirectory)) {
  fs.mkdirSync(videoDirectory, {
    recursive: true,
  });
}

// =========================
// THUMBNAIL UPLOAD DIRECTORY
// =========================

const thumbnailDirectory = path.join(__dirname, "../../assets/thumbnails");

if (!fs.existsSync(thumbnailDirectory)) {
  fs.mkdirSync(thumbnailDirectory, {
    recursive: true,
  });
}
// =========================
// MULTER STORAGE
// =========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "thumbnail") {
      cb(null, thumbnailDirectory);
    } else {
      cb(null, videoDirectory);
    }
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);

    let prefix = "lecture-";

    if (file.fieldname === "thumbnail") {
      prefix = "thumbnail-";
    }

    const fileName = prefix + Date.now() + extension;

    cb(null, fileName);
  },
});

// =========================
// VIDEO FILE FILTER
// =========================
const fileFilter = function (req, file, cb) {
  // VIDEO
  if (file.fieldname === "video") {
    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];

    if (allowedVideoTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Only MP4, WebM, OGG and MOV video files are allowed."),
      false,
    );
  }

  // THUMBNAIL
  if (file.fieldname === "thumbnail") {
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Only JPG, JPEG, PNG and WEBP thumbnail files are allowed."),
      false,
    );
  }

  cb(new Error("Invalid file field."), false);
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

router.get("/admin", adminAuthMiddleware, async (req, res) => {
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
});


// PUBLIC COURSE CONTENT - METADATA ONLY
router.get("/course/:courseId", async (req, res) => {
  try {
    const lectures = await Lecture.find({
      courseId: req.params.courseId,
    })
      .select("courseId number title description")
      .sort({ number: 1 });

    return res.status(200).json({ lectures });
  } catch (error) {
    console.error("Public Course Content Error:", error);

    return res.status(500).json({
      message: "Unable to fetch course content",
    });
  }
});

// =========================
// ADD LECTURE WITH VIDEO
// =========================

router.post(
  "/",
  adminAuthMiddleware,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  async (req, res) => {
    try {
      const { courseId, number, title, description } = req.body;

      if (!courseId || !number || !title) {
        return res.status(400).json({
          message: "Course, lecture number and title are required.",
        });
      }

      if (!req.files || !req.files.video) {
        return res.status(400).json({
          message: "Video file is required.",
        });
      }

      const videoFile = req.files.video[0];

      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

      const lecture = await Lecture.create({
        lectureId: "LECTURE" + Date.now(),
        courseId: courseId,
        number: Number(number),
        title: title.trim(),
        description: description ? description.trim() : "",

        video: "/assets/videos/" + videoFile.filename,

        thumbnail: thumbnailFile
          ? "/assets/thumbnails/" + thumbnailFile.filename
          : "",
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
  },
);

// =========================
// PROTECTED VIDEO STREAM
// =========================
router.get("/video/:lectureId", authMiddleware, async (req, res) => {
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
        $in: ["Paid", "Completed", "Success", "Successful"],
      },
      "courses.id": lecture.courseId,
    });

    if (!order) {
      return res.status(403).json({
        message: "You have not purchased this course.",
      });
    }

    // R2 video: generate a temporary playback URL
    if (
      typeof lecture.video === "string" &&
      lecture.video.startsWith("courses/") &&
      lecture.video.includes("/videos/")
    ) {
      if (!requireR2(res)) return;

      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: lecture.video,
        }),
        { expiresIn: 300 },
      );

      res.set("Cache-Control", "no-store");

      return res.status(200).json({
        url,
        expiresIn: 300,
        type: "r2",
      });
    }

    // Get only the filename from stored video path
    const fileName = path.basename(lecture.video);
    const filePath = path.join(videoDirectory, fileName);

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
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize || end >= fileSize) {
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
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
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
    console.error("Protected Video Error:", error);

    res.status(500).json({
      message: "Unable to load video.",
    });
  }
});
// =========================
// GET COURSE LECTURES
// PURCHASE REQUIRED
// =========================

router.get("/course/:courseId", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // ========================================
    // CHECK COURSE PURCHASE ACCESS
    // ========================================

    const order = await Order.findOne({
      user: req.user.userId,

      status: {
        $in: ["Paid", "Completed", "Success", "Successful"],
      },

      "courses.id": courseId,
    });

    // ========================================
    // ACCESS DENIED
    // ========================================

    if (!order) {
      return res.status(403).json({
        message: "You have not purchased this course.",
        access: false,
      });
    }

    // ========================================
    // GET COURSE LECTURES
    // ========================================

    const lectures = await Lecture.find({
      courseId: courseId,
    }).sort({
      number: 1,
    });

    // ========================================
    // ACCESS GRANTED
    // ========================================

    res.status(200).json({
      message: "Course lectures fetched successfully",
      access: true,
      lectures: lectures,
    });
  } catch (error) {
    console.error("Get Course Lectures Error:", error);

    res.status(500).json({
      message: "Server error",
      access: false,
    });
  }
});
// =========================
// EDIT LECTURE - ADMIN
// =========================

router.put("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { courseId, number, title, description } = req.body;
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found.",
      });
    }

    lecture.courseId = courseId;
    lecture.number = Number(number);
    lecture.title = title.trim();
    lecture.description = description ? description.trim() : "";

    await lecture.save();

    res.status(200).json({
      message: "Lecture updated successfully.",
      lecture: lecture,
    });
  } catch (error) {
    console.error("Edit Lecture Error:", error);

    res.status(500).json({
      message: "Unable to update lecture.",
    });
  }
});
// =========================
// DELETE LECTURE - ADMIN
// =========================
router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found.",
      });
    }

    // =========================
    // DELETE VIDEO FILE
    // =========================
    if (lecture.video) {
      if (
        typeof lecture.video === "string" &&
        lecture.video.startsWith("courses/") &&
        lecture.video.includes("/videos/")
      ) {
        if (!requireR2(res)) return;

        await s3.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: lecture.video,
          }),
        );

        console.log("R2 video deleted:", lecture.video);
      } else {
        const fileName = path.basename(lecture.video);
        const filePath = path.join(videoDirectory, fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Local video deleted:", fileName);
        }
      }
    }
    // =========================
    // DELETE THUMBNAIL FILE
    // =========================

    if (lecture.thumbnail) {
      const thumbnailFileName = path.basename(lecture.thumbnail);

      const thumbnailFilePath = path.join(
        thumbnailDirectory,
        thumbnailFileName,
      );

      if (fs.existsSync(thumbnailFilePath)) {
        fs.unlinkSync(thumbnailFilePath);
        console.log("Thumbnail file deleted:", thumbnailFileName);
      }
    }
    // =========================
    // DELETE MONGODB RECORD
    // =========================
    await Lecture.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Lecture and video deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Lecture Error:", error);

    res.status(500).json({
      message: "Unable to delete lecture.",
    });
  }
});
module.exports = router;
