const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: String,
      required: true,
    },

    completedLectures: {
      type: [Number],
      default: [],
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    currentLecture: {
      type: Number,
      default: 0,
    },
    videoPositions: {
  type: Map,
  of: Number,
  default: {},
},
  },
  {
    timestamps: true,
  },
);

progressSchema.index({ user: 1, courseId: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;
