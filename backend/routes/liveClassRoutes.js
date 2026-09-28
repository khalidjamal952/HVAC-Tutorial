const express = require("express");
const LiveClass = require("../models/LiveClass");
const Order = require("../models/Order");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================
// GET PURCHASED COURSE LIVE CLASSES - STUDENT
// =========================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      // Get successful orders of current user
      const orders = await Order.find({
        user: req.user.userId,
        status: {
          $in: [
            "Paid",
            "Completed",
            "Success",
            "Successful",
          ],
        },
      });

      // Get purchased course IDs
      const purchasedCourseIds = [];

      orders.forEach(function (order) {
        if (Array.isArray(order.courses)) {
          order.courses.forEach(function (course) {
            if (
              course.id &&
              !purchasedCourseIds.includes(course.id)
            ) {
              purchasedCourseIds.push(course.id);
            }
          });
        }
      });

      // No purchased courses
      if (purchasedCourseIds.length === 0) {
        return res.status(200).json({
          message: "No purchased course live classes found.",
          liveClasses: [],
        });
      }

      // Get only purchased course live classes
      const liveClasses = await LiveClass.find({
        courseId: {
          $in: purchasedCourseIds,
        },
      }).sort({
        date: 1,
        time: 1,
      });

      res.status(200).json({
        message: "Purchased course live classes fetched successfully.",
        liveClasses: liveClasses,
      });
    } catch (error) {
      console.error(
        "Get Purchased Live Classes Error:",
        error
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);
// =========================================
// GET ALL LIVE CLASSES - ADMIN
// =========================================

router.get("/admin", adminAuthMiddleware, async (req, res) => {
  try {
    const liveClasses = await LiveClass.find().sort({
      date: 1,
      time: 1,
    });

    res.status(200).json({
      message: "Live classes fetched successfully.",
      liveClasses: liveClasses,
    });
  } catch (error) {
    console.error("Get Admin Live Classes Error:", error);

    res.status(500).json({
      message: "Server error.",
    });
  }
});

// =========================================
// ADD LIVE CLASS - ADMIN
// =========================================

router.post("/admin", adminAuthMiddleware, async (req, res) => {
  try {
    const { title, courseId, date, time, instructor, link, description } =
      req.body;

    if (!title || !courseId || !date || !time || !instructor || !link) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    const liveClass = await LiveClass.create({
      title: title.trim(),
      courseId,
      date,
      time,
      instructor: instructor.trim(),
      link: link.trim(),
      description: description ? description.trim() : "",
    });

    res.status(201).json({
      message: "Live class added successfully.",
      liveClass: liveClass,
    });
  } catch (error) {
    console.error("Add Live Class Error:", error);

    res.status(500).json({
      message: "Unable to add live class.",
    });
  }
});

// =========================================
// UPDATE LIVE CLASS - ADMIN
// =========================================

router.put("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { title, courseId, date, time, instructor, link, description } =
      req.body;

    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        message: "Live class not found.",
      });
    }

    liveClass.title = title.trim();
    liveClass.courseId = courseId;
    liveClass.date = date;
    liveClass.time = time;
    liveClass.instructor = instructor.trim();
    liveClass.link = link.trim();
    liveClass.description = description ? description.trim() : "";

    await liveClass.save();

    res.status(200).json({
      message: "Live class updated successfully.",
      liveClass: liveClass,
    });
  } catch (error) {
    console.error("Update Live Class Error:", error);

    res.status(500).json({
      message: "Unable to update live class.",
    });
  }
});

// =========================================
// DELETE LIVE CLASS - ADMIN
// =========================================

router.delete("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const liveClass = await LiveClass.findByIdAndDelete(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        message: "Live class not found.",
      });
    }

    res.status(200).json({
      message: "Live class deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Live Class Error:", error);

    res.status(500).json({
      message: "Unable to delete live class.",
    });
  }
});

module.exports = router;
