const express = require("express");
const Course = require("../models/Course");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =========================================
// GET ALL COURSES
// =========================================

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({
      createdAt: -1,
    });

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

router.post(
  "/admin/seed",
  adminAuthMiddleware,
  async (req, res) => {
    try {
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
  }
);

// DELETE COURSE
router.delete(
  "/admin/:id",
  adminAuthMiddleware,
  async (req, res) => {
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
  }
);
// UPDATE COURSE
router.put(
  "/admin/:id",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const {
        title,
        category,
        lessons,
        duration,
        price,
        originalPrice,
        students,
        description,
      } = req.body;

      const course = await Course.findOne({
        id: req.params.id,
      });

      if (!course) {
        return res.status(404).json({
          message: "Course not found.",
        });
      }

      course.title = title;
      course.category = category;
      course.lessons = Number(lessons);
      course.duration = duration;
      course.price = Number(price);
      course.originalPrice = Number(originalPrice);
      course.students = Number(students);
      course.description = description;

      await course.save();

      res.status(200).json({
        message: "Course updated successfully.",
        course: course,
      });
    } catch (error) {
      console.error("Update Course Error:", error);

      res.status(500).json({
        message: "Unable to update course.",
      });
    }
  }
);

// ADD NEW COURSE
router.post(
  "/admin",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const {
        id,
        title,
        category,
        lessons,
        duration,
        price,
        originalPrice,
        students,
        description,
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

      const existingCourse = await Course.findOne({
        id: id,
      });

      if (existingCourse) {
        return res.status(409).json({
          message: "Course with this ID already exists.",
        });
      }

      const course = await Course.create({
        id: id,
        title: title,
        category: category,
        lessons: Number(lessons),
        duration: duration,
        price: Number(price),
        originalPrice: Number(originalPrice),
        students: Number(students) || 0,
        description: description || "",
      });

      res.status(201).json({
        message: "Course added successfully.",
        course: course,
      });
    } catch (error) {
      console.error("Add Course Error:", error);

      res.status(500).json({
        message: "Unable to add course.",
      });
    }
  }
);
module.exports = router;