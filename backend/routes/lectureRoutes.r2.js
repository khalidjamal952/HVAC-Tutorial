const express = require("express");
const Order = require("../models/Order");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Lecture = require("../models/Lecture");
const UploadSession = require("../models/UploadSession");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const router = express.Router();

const videoDirectory = path.join(__dirname, "../../assets/videos");
const thumbnailDirectory = path.join(__dirname, "../../assets/thumbnails");

if (!fs.existsSync(videoDirectory))
  fs.mkdirSync(videoDirectory, { recursive: true });
if (!fs.existsSync(thumbnailDirectory))
  fs.mkdirSync(thumbnailDirectory, { recursive: true });

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

// R2 multipart upload settings
const R2_MAX_VIDEO_SIZE = 50 * 1024 * 1024 * 1024;
const R2_PART_SIZE = 16 * 1024 * 1024;

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
    console.log("Decoded admin JWT:", req.admin);
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
      return res.status(400).json({ message: "Unsupported video type." });
    }

    const extension = path.extname(fileName).toLowerCase();
    if (![".mp4", ".webm", ".ogg", ".mov"].includes(extension)) {
      return res.status(400).json({
        message: "Unsupported video extension.",
      });
    }

    const key = `courses/${encodeURIComponent(String(courseId))}/videos/${Date.now()}-${crypto.randomUUID()}${extension}`;

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

    const adminId = String(
      req.admin?.userId ||
        req.admin?._id ||
        req.admin?.id ||
        req.admin?.sub ||
        "",
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

    try {
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

// GENERATE SIGNED URL FOR EACH PART
router.post("/upload/sign-part", adminAuthMiddleware, async (req, res) => {
  try {
    if (!requireR2(res)) return;

    const { key, uploadId, partNumber } = req.body;
    const part = Number(partNumber);

    const adminId = String(
      req.admin?.adminId ||
        req.admin?.userId ||
        req.admin?._id ||
        req.admin?.id ||
        req.admin?.sub ||
        "",
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

// COMPLETE MULTIPART UPLOAD
router.post("/upload/complete", adminAuthMiddleware, async (req, res) => {
  try {
    if (!requireR2(res)) return;

    const { key, uploadId, parts, courseId, number, title, description } =
      req.body;

    const adminId = String(
      req.admin?.userId ||
        req.admin?._id ||
        req.admin?.id ||
        req.admin?.sub ||
        "",
    );

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

    const expectedParts = Math.ceil(session.fileSize / R2_PART_SIZE);
    if (parts.length !== expectedParts) {
      return res.status(400).json({
        message: "Uploaded parts count does not match file size.",
      });
    }

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

    const result = await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: session.key,
        UploadId: session.uploadId,
        MultipartUpload: { Parts: normalizedParts },
      }),
    );

    const lectureId =
      "LECTURE" + Date.now() + crypto.randomBytes(3).toString("hex");

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

// ABORT MULTIPART UPLOAD
router.post("/upload/abort", adminAuthMiddleware, async (req, res) => {
  try {
    if (!requireR2(res)) return;

    const { key, uploadId } = req.body;

    const adminId = String(
      req.admin?.userId ||
        req.admin?._id ||
        req.admin?.id ||
        req.admin?.sub ||
        "",
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

function isR2Key(value) {
  // New records store an object key, e.g. courses/<courseId>/<file>.
  // Older records store a local URL such as /assets/videos/lecture-123.mp4.
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.startsWith("http://") &&
    !value.startsWith("https://")
  );
}

function safeLocalVideoPath(storedVideo) {
  const filename = path.basename(String(storedVideo || ""));
  if (!filename) return null;
  const resolved = path.resolve(videoDirectory, filename);
  const root = path.resolve(videoDirectory) + path.sep;
  return resolved.startsWith(root) ? resolved : null;
}

function safeLocalThumbnailPath(storedThumbnail) {
  const filename = path.basename(String(storedThumbnail || ""));
  if (!filename) return null;
  const resolved = path.resolve(thumbnailDirectory, filename);
  const root = path.resolve(thumbnailDirectory) + path.sep;
  return resolved.startsWith(root) ? resolved : null;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      file.fieldname === "thumbnail" ? thumbnailDirectory : videoDirectory,
    );
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname === "thumbnail" ? "thumbnail-" : "lecture-";
    cb(
      null,
      prefix +
        Date.now() +
        "-" +
        crypto.randomBytes(4).toString("hex") +
        extension,
    );
  },
});

const fileFilter = function (req, file, cb) {
  if (file.fieldname === "video") {
    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];
    if (allowedVideoTypes.includes(file.mimetype)) return cb(null, true);
    return cb(
      new Error("Only MP4, WebM, OGG and MOV video files are allowed."),
    );
  }

  if (file.fieldname === "thumbnail") {
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (allowedImageTypes.includes(file.mimetype)) return cb(null, true);
    return cb(
      new Error("Only JPG, JPEG, PNG and WEBP thumbnail files are allowed."),
    );
  }

  return cb(new Error("Invalid file field."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 * 1024, // 3 GiB
  },
});

function removeTempFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Temporary upload cleanup failed:", error.message);
  }
}

async function uploadVideoToR2(file, key) {
  if (!s3 || !isR2Configured())
    throw new Error("Cloudflare R2 is not configured on the server.");

  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype || "application/octet-stream",
      Metadata: {
        originalname: path.basename(file.originalname || "lecture-video"),
      },
    },
    queueSize: 3,
    partSize: 10 * 1024 * 1024,
    leavePartsOnError: false,
  });

  await uploader.done();
}

async function deleteR2Object(key) {
  if (!s3 || !isR2Configured())
    throw new Error("Cloudflare R2 is not configured on the server.");
  await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
}

// GET ALL LECTURES - ADMIN
router.get("/admin", adminAuthMiddleware, async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({ courseId: 1, number: 1 });
    res
      .status(200)
      .json({ message: "Lectures fetched successfully", lectures });
  } catch (error) {
    console.error("Get Admin Lectures Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD LECTURE WITH VIDEO: temporary local upload -> streamed multipart upload to private R2.
router.post(
  "/",
  adminAuthMiddleware,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    let videoFile = req.files && req.files.video ? req.files.video[0] : null;
    const thumbnailFile =
      req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
    let r2Key = null;
    let lectureSaved = false;

    try {
      const { courseId, number, title, description } = req.body;
      if (!courseId || !number || !title) {
        return res
          .status(400)
          .json({ message: "Course, lecture number and title are required." });
      }
      if (!videoFile) {
        return res.status(400).json({ message: "Video file is required." });
      }
      if (!isR2Configured()) {
        return res.status(503).json({
          message:
            "Cloudflare R2 is not configured. Check the server environment variables.",
        });
      }

      const lectureId =
        "LECTURE" + Date.now() + crypto.randomBytes(3).toString("hex");
      const extension =
        path.extname(videoFile.originalname).toLowerCase() || ".mp4";
      r2Key = `courses/${String(courseId).replace(/[^a-zA-Z0-9_-]/g, "_")}/${lectureId}${extension}`;

      await uploadVideoToR2(videoFile, r2Key);

      const lecture = await Lecture.create({
        lectureId,
        courseId,
        number: Number(number),
        title: title.trim(),
        description: description ? description.trim() : "",
        video: r2Key,
        // Preserve the current local thumbnail behavior.
        thumbnail: thumbnailFile
          ? "/assets/thumbnails/" + thumbnailFile.filename
          : "",
      });
      lectureSaved = true;

      return res.status(201).json({
        message: "Lecture added successfully",
        lecture,
      });
    } catch (error) {
      console.error("Add Lecture / R2 Upload Error:", error);

      if (r2Key && !lectureSaved && s3) {
        try {
          await deleteR2Object(r2Key);
        } catch (cleanupError) {
          console.error("R2 rollback cleanup failed:", cleanupError.message);
        }
      }

      return res.status(500).json({
        message: error.message || "Unable to upload lecture to Cloudflare R2.",
      });
    } finally {
      removeTempFile(videoFile && videoFile.path);
      // Keep thumbnails on the current local storage as before.
    }
  },
);

// PROTECTED VIDEO PLAYBACK
// R2 videos return JSON containing a short-lived signed URL.
// Legacy local videos keep the authenticated Range-streaming behavior so old records continue to work.
router.get("/video/:lectureId", authMiddleware, async (req, res) => {
  try {
    const lecture = await Lecture.findOne({ lectureId: req.params.lectureId });
    if (!lecture)
      return res.status(404).json({ message: "Lecture not found." });

    const order = await Order.findOne({
      user: req.user.userId,
      status: { $in: ["Paid", "Completed", "Success", "Successful"] },
      "courses.id": lecture.courseId,
    });

    if (!order)
      return res
        .status(403)
        .json({ message: "You have not purchased this course." });

    if (isR2Key(lecture.video)) {
      if (!isR2Configured()) {
        return res
          .status(503)
          .json({ message: "Cloudflare R2 is not configured on the server." });
      }
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: lecture.video }),
        { expiresIn: 3600 },
      );
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ url, expiresIn: 3600, type: "r2" });
    }

    // Backward compatibility for older records stored at /assets/videos/<filename>.
    const filePath = safeLocalVideoPath(lecture.video);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Video file not found." });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const extension = path.extname(filePath).toLowerCase();
    const contentType =
      extension === ".webm"
        ? "video/webm"
        : extension === ".ogg" || extension === ".ogv"
          ? "video/ogg"
          : extension === ".mov"
            ? "video/quicktime"
            : "video/mp4";

    res.set("Accept-Ranges", "bytes");
    res.set("Cache-Control", "private, no-store");

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        return res
          .status(416)
          .set("Content-Range", `bytes */${fileSize}`)
          .end();
      }

      let start;
      let end;
      if (!match[1]) {
        const suffixLength = Number(match[2]);
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : fileSize - 1;
      }

      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start < 0 ||
        start >= fileSize ||
        end < start
      ) {
        return res
          .status(416)
          .set("Content-Range", `bytes */${fileSize}`)
          .end();
      }
      end = Math.min(end, fileSize - 1);

      res.status(206);
      res.set({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": String(end - start + 1),
        "Content-Type": contentType,
      });
      const stream = fs.createReadStream(filePath, { start, end });
      stream.on("error", (error) => {
        console.error("Legacy video stream error:", error);
        if (!res.headersSent) res.status(500).end();
        else res.destroy(error);
      });
      return stream.pipe(res);
    }

    res.status(200);
    res.set({
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
    });
    const stream = fs.createReadStream(filePath);
    stream.on("error", (error) => {
      console.error("Legacy video stream error:", error);
      if (!res.headersSent) res.status(500).end();
      else res.destroy(error);
    });
    return stream.pipe(res);
  } catch (error) {
    console.error("Protected Video Error:", error);
    return res.status(500).json({ message: "Unable to load video." });
  }
});

// GET COURSE LECTURES - PURCHASE REQUIRED
router.get("/course/:courseId", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const order = await Order.findOne({
      user: req.user.userId,
      status: { $in: ["Paid", "Completed", "Success", "Successful"] },
      "courses.id": courseId,
    });

    if (!order) {
      return res.status(403).json({
        message: "You have not purchased this course.",
        access: false,
      });
    }

    const lectures = await Lecture.find({ courseId }).sort({ number: 1 });
    return res.status(200).json({
      message: "Course lectures fetched successfully",
      access: true,
      lectures,
    });
  } catch (error) {
    console.error("Get Course Lectures Error:", error);
    return res.status(500).json({ message: "Server error", access: false });
  }
});

// EDIT LECTURE - ADMIN
router.put("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { courseId, number, title, description } = req.body;
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture)
      return res.status(404).json({ message: "Lecture not found." });

    if (!courseId || !number || !title) {
      return res
        .status(400)
        .json({ message: "Course, lecture number and title are required." });
    }

    lecture.courseId = courseId;
    lecture.number = Number(number);
    lecture.title = title.trim();
    lecture.description = description ? description.trim() : "";
    await lecture.save();

    return res
      .status(200)
      .json({ message: "Lecture updated successfully.", lecture });
  } catch (error) {
    console.error("Edit Lecture Error:", error);
    return res.status(500).json({ message: "Unable to update lecture." });
  }
});

// DELETE LECTURE - ADMIN
router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture)
      return res.status(404).json({ message: "Lecture not found." });

    // Delete video from R2 for new records, or local disk for legacy records.
    if (lecture.video) {
      if (isR2Key(lecture.video)) {
        await deleteR2Object(lecture.video);
        console.log("R2 video deleted:", lecture.video);
      } else {
        const filePath = safeLocalVideoPath(lecture.video);
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Legacy local video deleted:", path.basename(filePath));
        }
      }
    }

    // Thumbnails remain local, matching the existing implementation.
    if (lecture.thumbnail) {
      const thumbnailPath = safeLocalThumbnailPath(lecture.thumbnail);
      if (thumbnailPath && fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        console.log("Thumbnail file deleted:", path.basename(thumbnailPath));
      }
    }

    await Lecture.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ message: "Lecture and video deleted successfully." });
  } catch (error) {
    console.error("Delete Lecture Error:", error);
    return res.status(500).json({ message: "Unable to delete lecture." });
  }
});

module.exports = router;
