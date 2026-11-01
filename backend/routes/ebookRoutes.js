const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

const { Upload } = require("@aws-sdk/lib-storage");
const { DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { s3, R2_BUCKET_NAME, isR2Configured } = require("../config/r2");

const Ebook = require("../models/Ebook");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =========================================
// TEMPORARY PDF UPLOAD DIRECTORY
// =========================================

const uploadDirectory = path.join(os.tmpdir(), "hvac-ebooks-temp");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// =========================================
// MULTER STORAGE
// =========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// =========================================
// MULTI-FORMAT FILE FILTER
// =========================================

const allowedMimeTypes = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword", "application/octet-stream"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
  ".ppt": ["application/vnd.ms-powerpoint", "application/octet-stream"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"],
  ".xls": ["application/vnd.ms-excel", "application/octet-stream"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
  ".jpg": ["image/jpeg", "application/octet-stream"],
  ".jpeg": ["image/jpeg", "application/octet-stream"],
  ".png": ["image/png", "application/octet-stream"],
  ".zip": ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
  ".dwg": ["application/acad", "application/x-acad", "application/octet-stream"],
  ".dxf": ["application/dxf", "application/x-dxf", "application/octet-stream"],
  ".dwt": ["application/octet-stream", "application/acad"],
  ".dwf": ["model/vnd.dwf", "application/octet-stream"]
};

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedTypes = allowedMimeTypes[extension];

  if (file.fieldname === "supportDocuments") {
    if (extension === ".pdf" && file.mimetype === "application/pdf") {
      return cb(null, true);
    }

    return cb(new Error("Support documents must be PDF files only."), false);
  }

  if (file.fieldname !== "pdf") {
    return cb(new Error("Invalid file field."), false);
  }

  if (allowedTypes && allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("Unsupported file format. Please upload an allowed document, image, ZIP, or AutoCAD file."), false);
};

// =========================================
// MULTER UPLOAD
// =========================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 300 * 1024 * 1024,
    files: 101,
  },
});

// =========================================
// TEMPORARY FILE CLEANUP
// =========================================

async function cleanupTempFile(file) {
  if (!file || !file.path) return;

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Temporary PDF Cleanup Error:", error.message);
    }
  }
}

async function cleanupTempFiles(files) {
  if (!files) return;

  const allFiles = Array.isArray(files)
    ? files
    : Object.values(files).flat();

  await Promise.all(allFiles.map(cleanupTempFile));
}

// =========================================
// UPLOAD PDF TO CLOUDFLARE R2
// =========================================

async function uploadEbookToR2(file, key) {
  if (!isR2Configured() || !s3) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
      Metadata: {
        originalname: path.basename(file.originalname).replace(/[^\x20-\x7E]/g, ""),
      },
    },
  });

  await uploader.done();
}

// =========================================
// DELETE OLD R2 OR LEGACY LOCAL PDF
// =========================================

async function deleteStoredEbook(filePath) {
  if (!filePath) return;

  // New R2 files
  if (filePath.startsWith("ebooks/")) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
      }),
    );

    console.log("Old E-Book deleted from R2:", filePath);
    return;
  }

  // Legacy local files
  if (filePath.startsWith("/assets/ebooks/")) {
    const filename = path.basename(filePath);
    const oldLocalPath = path.join(
      __dirname,
      "../..",
      "assets",
      "ebooks",
      filename,
    );

    if (fs.existsSync(oldLocalPath)) {
      await fs.promises.unlink(oldLocalPath);
      console.log("Legacy E-Book deleted:", filename);
    }
  }
}

// =========================================
// GET ALL ACTIVE E-BOOKS
// =========================================

router.get("/", async (req, res) => {
  try {
    const ebooks = await Ebook.find({
      status: "Active",
    }).sort({ createdAt: -1 });

    const safeEbooks = ebooks.map((ebook) => {
      const ebookData = ebook.toObject();

      // Never expose private support-document storage paths publicly.
      delete ebookData.supportDocuments;

      return ebookData;
    });

    res.status(200).json({
      ebooks: safeEbooks,
    });
  } catch (error) {
    console.error("Get E-Books Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// ADD NEW E-BOOK
// =========================================

router.post(
  "/",
  adminAuthMiddleware,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "supportDocuments", maxCount: 100 },
  ]),
  async (req, res) => {
    const uploadedKeys = [];
    const files = req.files || {};
    const mainFile = files.pdf?.[0];
    const supportFiles = files.supportDocuments || [];

    try {
      const { title, description, category, price } = req.body;

      if (!title || !description || !category) {
        return res.status(400).json({
          message: "Title, description and category are required.",
        });
      }

      if (!mainFile) {
        return res.status(400).json({
          message: "Please select a supported E-Book file.",
        });
      }

      if (!isR2Configured() || !s3) {
        return res.status(503).json({
          message: "Cloudflare R2 is not configured.",
        });
      }

      const extension = path.extname(mainFile.originalname).toLowerCase();
      const mainKey = `ebooks/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;

      await uploadEbookToR2(mainFile, mainKey);
      uploadedKeys.push(mainKey);

      const supportDocuments = [];

      for (const file of supportFiles) {
        const supportExtension = path.extname(file.originalname).toLowerCase();

        if (supportExtension !== ".pdf" || file.mimetype !== "application/pdf") {
          throw new Error("Support documents must be PDF files only.");
        }

        const supportKey = `ebooks/support/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.pdf`;

        await uploadEbookToR2(file, supportKey);
        uploadedKeys.push(supportKey);

        supportDocuments.push({
          fileName: path.basename(file.originalname),
          filePath: supportKey,
          relativePath: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      }

      const ebook = await Ebook.create({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        type: extension.replace(".", "").toUpperCase(),
        price: Number(price) || 0,
        fileName: path.basename(mainFile.originalname),
        filePath: mainKey,
        supportDocuments,
        status: "Active",
      });

      uploadedKeys.length = 0;

      return res.status(201).json({
        message: "E-Book and support documents uploaded successfully.",
        ebook,
      });
    } catch (error) {
      console.error("Add E-Book Error:", error);

      for (const key of uploadedKeys) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key,
            }),
          );
        } catch (cleanupError) {
          console.error("R2 Rollback Error:", cleanupError.message);
        }
      }

      return res.status(500).json({
        message: "Unable to upload E-Book and support documents.",
      });
    } finally {
      await cleanupTempFiles(files);
    }
  },
);
// UPDATE E-BOOK
// =========================================

router.put(
  "/:id",
  adminAuthMiddleware,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "supportDocuments", maxCount: 100 },
  ]),
  async (req, res) => {
    const files = req.files || {};
    const mainFile = files.pdf?.[0];
    const supportFiles = files.supportDocuments || [];
    const uploadedKeys = [];

    try {
      const ebook = await Ebook.findById(req.params.id);

      if (!ebook) {
        return res.status(404).json({
          message: "E-Book not found.",
        });
      }

      const { title, description, category, price } = req.body;

      if (title !== undefined) ebook.title = title.trim();
      if (description !== undefined) ebook.description = description.trim();
      if (category !== undefined) ebook.category = category.trim();
      if (price !== undefined) ebook.price = Number(price) || 0;

      const oldFilePath = ebook.filePath;

      if (mainFile || supportFiles.length > 0) {
        if (!isR2Configured() || !s3) {
          return res.status(503).json({
            message: "Cloudflare R2 is not configured.",
          });
        }
      }

      // Replace the main E-Book file only when a new file is selected.
      if (mainFile) {
        const extension = path.extname(mainFile.originalname).toLowerCase();
        const newKey = `ebooks/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;

        await uploadEbookToR2(mainFile, newKey);
        uploadedKeys.push(newKey);

        ebook.fileName = path.basename(mainFile.originalname);
        ebook.filePath = newKey;
        ebook.type = extension.replace(".", "").toUpperCase();
      }

      // Append new support PDFs without removing existing documents.
      for (const file of supportFiles) {
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension !== ".pdf" || file.mimetype !== "application/pdf") {
          throw new Error("Support documents must be PDF files only.");
        }

        const key = `ebooks/support/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.pdf`;

        await uploadEbookToR2(file, key);
        uploadedKeys.push(key);

        ebook.supportDocuments.push({
          fileName: path.basename(file.originalname),
          filePath: key,
          relativePath: file.originalname.replace(/\\/g, "/"),
          mimeType: "application/pdf",
          size: file.size,
        });
      }

      await ebook.save();

      // Database save succeeded. Keep newly uploaded files.
      uploadedKeys.length = 0;

      // Delete the old main PDF only after the database update succeeds.
      if (mainFile && oldFilePath && oldFilePath !== ebook.filePath) {
        try {
          await deleteStoredEbook(oldFilePath);
        } catch (deleteError) {
          console.error("Old E-Book Cleanup Warning:", deleteError.message);
        }
      }

      return res.status(200).json({
        message: "E-Book updated successfully.",
        ebook,
      });
    } catch (error) {
      console.error("Update E-Book Error:", error);

      // Roll back newly uploaded R2 files if the update fails.
      for (const key of uploadedKeys) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key,
            }),
          );
        } catch (cleanupError) {
          console.error("R2 Rollback Error:", cleanupError.message);
        }
      }

      return res.status(500).json({
        message: "Unable to update E-Book.",
      });
    } finally {
      await cleanupTempFiles(files);
    }
  },
);
// =========================================
// DELETE E-BOOK
// =========================================

router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        message: "E-Book not found.",
      });
    }

    // Collect the main PDF and all support PDF storage keys.
    const storageKeys = [
      ebook.filePath,
      ...(ebook.supportDocuments || []).map((doc) => doc.filePath),
    ].filter(Boolean);

    await Ebook.findByIdAndDelete(req.params.id);

    // Delete all associated files from R2 after database deletion.
    const cleanupResults = await Promise.allSettled(
      storageKeys.map((key) => deleteStoredEbook(key)),
    );

    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "E-Book Storage Cleanup Warning:",
          result.reason?.message || result.reason,
        );
      }
    });

    return res.status(200).json({
      message: "E-Book and its support documents deleted successfully.",
    });
  } catch (error) {
    console.error("Delete E-Book Error:", error);

    return res.status(500).json({
      message: "Unable to delete E-Book.",
    });
  }
});


// =========================================
// ADMIN SECURE E-BOOK PDF PREVIEW
// =========================================

router.get("/admin/:id/preview", adminAuthMiddleware, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        message: "E-Book not found.",
      });
    }

    const fileName = path.basename(ebook.fileName || `${ebook.title}.pdf`);

    // R2 PDF PREVIEW
    if (ebook.filePath.startsWith("ebooks/")) {
      if (!isR2Configured() || !s3) {
        return res.status(503).json({
          message: "Cloudflare R2 is not configured.",
        });
      }

      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: ebook.filePath,
        ResponseContentType: path.extname(fileName).toLowerCase() === ".pdf" ? "application/pdf" : "application/octet-stream",
        ResponseContentDisposition: `${path.extname(fileName).toLowerCase() === ".pdf" ? "inline" : "attachment"}; filename="${fileName.replace(/["\\]/g, "_")}"`,
      });

      const url = await getSignedUrl(s3, command, {
        expiresIn: 600,
      });

      res.set("Cache-Control", "no-store");

      return res.status(200).json({
        success: true,
        url,
        fileName,
      });
    }

    // LEGACY LOCAL PDF PREVIEW
    if (ebook.filePath.startsWith("/assets/ebooks/")) {
      const localPath = path.join(
        __dirname,
        "../..",
        "assets",
        "ebooks",
        path.basename(ebook.filePath),
      );

      if (!fs.existsSync(localPath)) {
        return res.status(404).json({
          message: "E-Book file not found.",
        });
      }

      res.set("Cache-Control", "no-store");

      const isPdf = path.extname(fileName).toLowerCase() === ".pdf";

      if (!isPdf) {
        return res.download(localPath, fileName);
      }

      res.set("Content-Type", "application/pdf");
      res.set("Content-Disposition", `inline; filename="${fileName.replace(/["\\]/g, "_")}"`);

      return res.sendFile(localPath);
    }

    return res.status(404).json({
      message: "Invalid E-Book storage path.",
    });
  } catch (error) {
    console.error("Admin E-Book Preview Error:", error);

    return res.status(500).json({
      message: "Unable to preview E-Book.",
    });
  }
});

module.exports = router;















