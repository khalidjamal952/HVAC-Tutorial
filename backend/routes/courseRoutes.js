const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Course = require("../models/Course");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =========================================
// COURSE THUMBNAIL UPLOAD
// =========================================

const thumbnailDirectory = path.join(
  process.env.HOME || "/home/u822452811",
  "storage",
  "course-thumbnails",
);

if (!fs.existsSync(thumbnailDirectory)) {
  fs.mkdirSync(thumbnailDirectory, {
    recursive: true,
  });
}

console.log("THUMBNAIL DIRECTORY:", thumbnailDirectory);
console.log("THUMBNAIL FOLDER EXISTS:", fs.existsSync(thumbnailDirectory));

if (!fs.existsSync(thumbnailDirectory)) {
  fs.mkdirSync(thumbnailDirectory, {
    recursive: true,
  });
}
console.log(
  "THUMBNAIL FOLDER AFTER CREATION:",
  fs.existsSync(thumbnailDirectory),
);

const thumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, thumbnailDirectory);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;

    cb(null, uniqueName);
  },
});

const thumbnailFileFilter = function (req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
// =========================================
// GET ALL COURSES
// =========================================

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({
      createdAt: -1,
    });

    for (const course of courses) {
      if (course.thumbnail) {
        const filename = path.basename(course.thumbnail);
        const filePath = path.join(thumbnailDirectory, filename);

        console.log({
          course: course.title,
          thumbnail: course.thumbnail,
          fileExists: fs.existsSync(filePath),
        });
      }
    }

    res.status(200).json({
      message: "Courses fetched successfully",
      courses: courses,
    });
  } catch (error) {
    console.error("Get Courses Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================
// SEED DEFAULT COURSES
// =========================================

router.post("/admin/seed", adminAuthMiddleware, async (req, res) => {
  try {
    console.log("ADD COURSE FILE:", req.file);
    console.log("ADD COURSE BODY:", req.body);

    console.log("Uploaded thumbnail:", req.file);
    const defaultCourses = [
      {
        id: "hvac-fundamentals",
        title: "HVAC Fundamentals",
        category: "ac",
        lessons: 25,
        duration: "6 hours",
        price: 499,
        originalPrice: 999,
        students: 125,
        description:
          "Learn the fundamentals of HVAC systems, components and basic working principles.",
      },
      {
        id: "air-conditioning",
        title: "Air Conditioning Basics",
        category: "ac",
        lessons: 20,
        duration: "5 hours",
        price: 599,
        originalPrice: 1199,
        students: 98,
        description:
          "Understand air conditioning systems, components, operation and basic maintenance.",
      },
      {
        id: "refrigeration",
        title: "Refrigeration Fundamentals",
        category: "refrigeration",
        lessons: 30,
        duration: "8 hours",
        price: 699,
        originalPrice: 1499,
        students: 143,
        description:
          "Learn refrigeration cycles, components, systems and practical fundamentals.",
      },
      {
        id: "hvac-electrical",
        title: "HVAC Electrical & Controls",
        category: "electrical",
        lessons: 22,
        duration: "6 hours",
        price: 799,
        originalPrice: 1599,
        students: 87,
        description:
          "Learn HVAC electrical systems, wiring, controls and troubleshooting basics.",
      },
      {
        id: "installation-service",
        title: "HVAC Installation & Service",
        category: "service",
        lessons: 35,
        duration: "10 hours",
        price: 899,
        originalPrice: 1799,
        students: 156,
        description:
          "Learn practical HVAC installation, servicing and maintenance procedures.",
      },
      {
        id: "troubleshooting",
        title: "HVAC Troubleshooting",
        category: "service",
        lessons: 28,
        duration: "7 hours",
        price: 749,
        originalPrice: 1499,
        students: 112,
        description:
          "Learn systematic HVAC troubleshooting and common fault diagnosis techniques.",
      },
    ];

    let insertedCount = 0;

    for (const course of defaultCourses) {
      const existingCourse = await Course.findOne({
        id: course.id,
      });

      if (!existingCourse) {
        await Course.create(course);
        insertedCount++;
      }
    }

    res.status(200).json({
      message: "Courses seeded successfully.",
      insertedCount: insertedCount,
    });
  } catch (error) {
    console.error("Seed Courses Error:", error);

    res.status(500).json({
      message: "Unable to seed courses.",
    });
  }
});

// DELETE COURSE
router.delete("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const course = await Course.findOne({
      id: req.params.id,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    await Course.deleteOne({
      id: req.params.id,
    });

    res.status(200).json({
      message: "Course deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Course Error:", error);

    res.status(500).json({
      message: "Unable to delete course.",
    });
  }
});

/* UPDATE COURSE */
router.put(
  "/admin/:id",
  adminAuthMiddleware,
  thumbnailUpload.single("thumbnail"),
  async (req, res) => {
    try {
      const {
        title,
        category,
        lessons,
        duration,
        price,
        originalPrice,
        description,
        outcomes,
        requirements,
        tags,
        audience,
      } = req.body;

      const course = await Course.findOne({
        id: req.params.id,
      });

      if (!course) {
        return res.status(404).json({
          message: "Course not found.",
        });
      }

      // Update thumbnail if a new image is uploaded
      if (req.file) {
        course.thumbnail = "/assets/course-thumbnails/" + req.file.filename;
      }

      if (title !== undefined) course.title = title;
      if (category !== undefined) course.category = category;
      if (lessons !== undefined) course.lessons = Number(lessons);
      if (duration !== undefined) course.duration = duration;
      if (price !== undefined) course.price = Number(price);
      if (originalPrice !== undefined) {
        course.originalPrice = Number(originalPrice);
      }
      if (description !== undefined) course.description = description;
      if (outcomes !== undefined) course.outcomes = outcomes;
      if (requirements !== undefined) course.requirements = requirements;
      if (audience !== undefined) course.audience = audience;

      if (tags !== undefined) {
        if (Array.isArray(tags)) {
          course.tags = tags;
        } else {
          try {
            const parsedTags = JSON.parse(tags);

            if (Array.isArray(parsedTags)) {
              course.tags = parsedTags;
            } else {
              course.tags = String(tags)
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);
            }
          } catch (error) {
            course.tags = String(tags)
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean);
          }
        }
      }

      await course.save();

      return res.status(200).json({
        message: "Course updated successfully.",
        course,
      });
    } catch (error) {
      console.error("Update Course Error:", error);

      return res.status(500).json({
        message: "Unable to update course.",
      });
    }
  },
);

/* ADD NEW COURSE */
router.post(
  "/admin",
  adminAuthMiddleware,
  thumbnailUpload.single("thumbnail"),
  async (req, res) => {
    console.log("ADD COURSE FILE:", req.file);
    console.log("ADD COURSE BODY:", req.body);
    try {
      const {
        id,
        title,
        category,
        lessons,
        duration,
        price,
        originalPrice,
        description,

        outcomes,
        requirements,
        tags,
        audience,
      } = req.body;

      if (
        !id ||
        !title ||
        !category ||
        lessons === undefined ||
        !duration ||
        price === undefined ||
        originalPrice === undefined
      ) {
        return res.status(400).json({
          message: "Course details are required.",
        });
      }

      const existingCourse = await Course.findOne({ id });

      if (existingCourse) {
        return res.status(409).json({
          message: "Course with this ID already exists.",
        });
      }

      const course = await Course.create({
        id,
        title,
        category,
        lessons: Number(lessons),
        duration,
        price: Number(price),
        originalPrice: Number(originalPrice),
        description: description || "",
        thumbnail: req.file
          ? "/assets/course-thumbnails/" + req.file.filename
          : "",
        outcomes: outcomes || "",
        requirements: requirements || "",

        tags: (() => {
          if (Array.isArray(tags)) return tags;

          if (typeof tags === "string") {
            try {
              const parsedTags = JSON.parse(tags);

              if (Array.isArray(parsedTags)) return parsedTags;
            } catch (error) {
              // Handle comma-separated tags
            }

            return tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean);
          }

          return [];
        })(),
      });

      return res.status(201).json({
        message: "Course added successfully.",
        course,
      });
    } catch (error) {
      console.error("Add Course Error:", error);

      return res.status(500).json({
        message: "Unable to add course.",
      });
    }
  },
);

module.exports = router;
