const express = require("express");
const Category = require("../models/Category");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const router = express.Router();

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.json({
      categories: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    res.status(500).json({
      message: "Unable to load categories.",
    });
  }
});

// ADD new category
router.post("/", adminAuthMiddleware, async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category already exists.",
      });
    }

    const category = await Category.create({
      name: name,
    });

    res.status(201).json({
      message: "Category added successfully.",
      category: category,
    });
  } catch (error) {
    console.error("Add Category Error:", error);

    res.status(500).json({
      message: "Unable to add category.",
    });
  }
});

module.exports = router;
