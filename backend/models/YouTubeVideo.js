const mongoose = require("mongoose");

const youtubeVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
    },

    youtubeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const YouTubeVideo = mongoose.model("YouTubeVideo", youtubeVideoSchema);

module.exports = YouTubeVideo;
