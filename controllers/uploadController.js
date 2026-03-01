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

const uploadFile = async (req, res, next) => {
  try {
    const { userName, note } = req.body;
    const { storeId } = req.params;

    if (!userName?.trim()) {
      return res.status(400).json({ message: "Name required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const resourceType =
      req.file.mimetype === "application/pdf" ? "raw" : "auto";

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

const getStoreUploads = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const files = await FileUpload.find({ shop: storeId })
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await FileUpload.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
        resource_type:
          file.fileType === "application/pdf" ? "raw" : "auto",
      });
    }

    await file.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await FileUpload.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const response = await axios.get(file.fileUrl, {
      responseType: "stream",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalFileName}"`
    );
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] ||
        "application/octet-stream"
    );

    response.data.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadFile,
  getStoreUploads,
  deleteFile,
  downloadFile,
};
