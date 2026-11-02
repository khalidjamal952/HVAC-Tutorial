const express = require("express");
const YouTubeVideo = require("../models/YouTubeVideo");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// Extract and validate YouTube video ID
function getYouTubeId(url) {
  try {
    const parsed = new URL(url);
    let id = "";

    if (parsed.hostname === "youtu.be") {
      id = parsed.pathname.slice(1);
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)
    ) {
      if (parsed.pathname === "/watch") {
        id = parsed.searchParams.get("v") || "";
      } else if (parsed.pathname.startsWith("/embed/") ||
                 parsed.pathname.startsWith("/shorts/")) {
        id = parsed.pathname.split("/")[2] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// GET ACTIVE VIDEOS - PUBLIC HOMEPAGE
router.get("/", async (req, res) => {
  try {
    const videos = await YouTubeVideo.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("title description youtubeUrl youtubeId isFeatured displayOrder");

    res.status(200).json({
      message: "YouTube videos fetched successfully.",
      videos,
    });
  } catch (error) {
    console.error("Get Public YouTube Videos Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET ALL VIDEOS - ADMIN
router.get("/admin", adminAuthMiddleware, async (req, res) => {
  try {
    const videos = await YouTubeVideo.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.status(200).json({
      message: "YouTube videos fetched successfully.",
      videos,
    });
  } catch (error) {
    console.error("Get Admin YouTube Videos Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// ADD VIDEO - ADMIN
router.post("/admin", adminAuthMiddleware, async (req, res) => {
  try {
    const { title, description, youtubeUrl, isActive, isFeatured, displayOrder } =
      req.body;

    if (!title || !youtubeUrl) {
      return res.status(400).json({
        message: "Video title and YouTube URL are required.",
      });
    }

    const youtubeId = getYouTubeId(youtubeUrl.trim());

    if (!youtubeId) {
      return res.status(400).json({
        message: "Please provide a valid YouTube video URL.",
      });
    }

    const existingVideo = await YouTubeVideo.findOne({ youtubeId });

    if (existingVideo) {
      return res.status(409).json({
        message: "This YouTube video has already been added.",
      });
    }

    if (isFeatured === true || isFeatured === "true") {
      await YouTubeVideo.updateMany({}, { $set: { isFeatured: false } });
    }

    const video = await YouTubeVideo.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      isActive: isActive !== false && isActive !== "false",
      isFeatured: isFeatured === true || isFeatured === "true",
      displayOrder: Number.isFinite(Number(displayOrder))
        ? Number(displayOrder)
        : 0,
    });

    res.status(201).json({
      message: "YouTube video added successfully.",
      video,
    });
  } catch (error) {
    console.error("Add YouTube Video Error:", error);
    res.status(500).json({ message: "Unable to add YouTube video." });
  }
});

// UPDATE VIDEO - ADMIN
router.put("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const video = await YouTubeVideo.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "YouTube video not found." });
    }

    const { title, description, youtubeUrl, isActive, isFeatured, displayOrder } =
      req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "Video title is required." });
      }
      video.title = title.trim();
    }

    if (description !== undefined) {
      video.description = description.trim();
    }

    if (youtubeUrl !== undefined) {
      const youtubeId = getYouTubeId(youtubeUrl.trim());

      if (!youtubeId) {
        return res.status(400).json({
          message: "Please provide a valid YouTube video URL.",
        });
      }

      const duplicate = await YouTubeVideo.findOne({
        youtubeId,
        _id: { $ne: video._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "This YouTube video has already been added.",
        });
      }

      video.youtubeUrl = youtubeUrl.trim();
      video.youtubeId = youtubeId;
    }

    if (isActive !== undefined) {
      video.isActive = isActive === true || isActive === "true";
    }

    if (isFeatured === true || isFeatured === "true") {
      await YouTubeVideo.updateMany(
        { _id: { $ne: video._id } },
        { $set: { isFeatured: false } }
      );
      video.isFeatured = true;
    } else if (isFeatured !== undefined) {
      video.isFeatured = false;
    }

    if (displayOrder !== undefined) {
      const order = Number(displayOrder);

      if (!Number.isFinite(order)) {
        return res.status(400).json({
          message: "Display order must be a valid number.",
        });
      }

      video.displayOrder = order;
    }

    await video.save();

    res.status(200).json({
      message: "YouTube video updated successfully.",
      video,
    });
  } catch (error) {
    console.error("Update YouTube Video Error:", error);
    res.status(500).json({ message: "Unable to update YouTube video." });
  }
});

// DELETE VIDEO - ADMIN
router.delete("/admin/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const video = await YouTubeVideo.findByIdAndDelete(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "YouTube video not found." });
    }

    res.status(200).json({
      message: "YouTube video deleted successfully.",
    });
  } catch (error) {
    console.error("Delete YouTube Video Error:", error);
    res.status(500).json({ message: "Unable to delete YouTube video." });
  }
});

module.exports = router;
