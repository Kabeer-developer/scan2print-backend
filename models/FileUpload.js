const mongoose = require("mongoose");

const printJobSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    note: {
      type: String,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    originalFileName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "printed"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrintJob", printJobSchema);
