
const axios = require("axios");
const FileUpload = require("../models/FileUpload");
const Store = require("../models/Store");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

const uploadToCloudinary = (buffer, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "customer_uploads",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// =====================================================
// CUSTOMER UPLOAD
// =====================================================

const uploadFile = async (req, res, next) => {
  try {
    const { userName, note } = req.body;
    const { storeId } = req.params;

    if (!userName?.trim()) {
      return res.status(400).json({
        message: "Name required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    const resourceType =
      req.file.mimetype === "application/pdf"
        ? "raw"
        : "auto";

    const result = await uploadToCloudinary(
      req.file.buffer,
      resourceType
    );

    const file = await FileUpload.create({
      shop: storeId,
      userName: userName.trim(),
      note: note?.trim() || "",
      fileUrl: result.secure_url,
      fileType: req.file.mimetype,
      originalFileName: req.file.originalname,
      status: "pending",
      cloudinaryPublicId: result.public_id,
    });

    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
};

// =====================================================
// GET STORE FILES
// =====================================================

const getStoreUploads = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    // Make sure the logged-in store can only access
    // its own uploaded files.
    if (req.shop._id.toString() !== storeId.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const files = await FileUpload.find({
      shop: storeId,
    }).sort({
      createdAt: -1,
    });

    res.json(files);
  } catch (err) {
    next(err);
  }
};

// =====================================================
// VIEW FILE
// =====================================================

const viewFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    // IMPORTANT:
    // Only the store that owns the file can view it.
    if (file.shop.toString() !== req.shop._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to view this file",
      });
    }

    if (!file.fileUrl) {
      return res.status(404).json({
        message: "File URL not found",
      });
    }

    // Fetch the actual file from Cloudinary.
    const response = await axios.get(file.fileUrl, {
      responseType: "stream",
    });

    // Tell the browser to DISPLAY the file,
    // rather than download it.
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] ||
        file.fileType ||
        "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(
        file.originalFileName
      )}"`
    );

    // Prevent caching of the protected file.
    res.setHeader(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    response.data.pipe(res);
  } catch (err) {
    next(err);
  }
};

// =====================================================
// DELETE FILE
// =====================================================

const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    // Only the owner store can delete its file.
    if (file.shop.toString() !== req.shop._id.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    if (file.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(
        file.cloudinaryPublicId,
        {
          resource_type:
            file.fileType === "application/pdf"
              ? "raw"
              : "auto",
        }
      );
    }

    await file.deleteOne();

    res.json({
      message: "Deleted",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadFile,
  getStoreUploads,
  viewFile,
  deleteFile,
};

