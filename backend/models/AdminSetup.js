const mongoose = require("mongoose");

const adminSetupSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: "client-handover",
  },
  completed: {
    type: Boolean,
    default: false,
  },
  inProgress: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("AdminSetup", adminSetupSchema);
