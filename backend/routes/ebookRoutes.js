const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Ebook = require("../models/Ebook");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =========================================
// PDF UPLOAD FOLDER
// =========================================

const uploadDirectory = path.join(__dirname, "../../assets/ebooks");

// Create folder if it does not exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// =========================================
// MULTER STORAGE
// =========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {
    const originalName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "-");

    const uniqueName = Date.now() + "-" + originalName;

    cb(null, uniqueName);
  },
});

// =========================================
// PDF FILE FILTER
// =========================================

const fileFilter = function (req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.mimetype === "application/pdf" && extension === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};

// =========================================
// MULTER UPLOAD
// =========================================

const upload = multer({
  storage: storage,

  fileFilter: fileFilter,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// =========================================
// GET ALL E-BOOKS
// =========================================

router.get("/", async (req, res) => {
  try {
    const ebooks = await Ebook.find({
      status: "Active",
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      ebooks: ebooks,
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
  upload.single("pdf"),
  async (req, res) => {
    try {
      const { title, description, category, price } = req.body;

      if (!title || !description || !category) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(400).json({
          message: "Title, description and category are required.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a PDF file.",
        });
      }

      const ebook = await Ebook.create({
        title: title.trim(),

        description: description.trim(),

        category: category.trim(),

        type: "PDF",

        price: Number(price) || 0,

        fileName: req.file.originalname,

        filePath: "/assets/ebooks/" + req.file.filename,

        status: "Active",
      });

      res.status(201).json({
        message: "E-Book uploaded successfully.",

        ebook: ebook,
      });
    } catch (error) {
      console.error("Add E-Book Error:", error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        message: "Server error",
      });
    }
  },
);

// =========================================
// UPDATE E-BOOK
// =========================================

router.put(
  "/:id",
  adminAuthMiddleware,
  upload.single("pdf"),
  async (req, res) => {
    try {
      const ebook = await Ebook.findById(req.params.id);

      if (!ebook) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(404).json({
          message: "E-Book not found.",
        });
      }

      const { title, description, category, price } = req.body;

      if (title !== undefined) {
        ebook.title = title.trim();
      }

      if (description !== undefined) {
        ebook.description = description.trim();
      }

      if (category !== undefined) {
        ebook.category = category.trim();
      }

      if (price !== undefined) {
        ebook.price = Number(price) || 0;
      }

      // Replace PDF if a new PDF is selected
      if (req.file) {
        const oldFilePath = path.join(
          __dirname,
          "../..",
          ebook.filePath.replace("/assets/", "assets/"),
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        ebook.fileName = req.file.originalname;

        ebook.filePath = "/assets/ebooks/" + req.file.filename;
      }

      await ebook.save();

      res.status(200).json({
        message: "E-Book updated successfully.",

        ebook: ebook,
      });
    } catch (error) {
      console.error("Update E-Book Error:", error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        message: "Server error",
      });
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

    const filePath = path.join(
      __dirname,
      "../..",
      ebook.filePath.replace("/assets/", "assets/"),
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Ebook.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "E-Book deleted successfully.",
    });
  } catch (error) {
    console.error("Delete E-Book Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
