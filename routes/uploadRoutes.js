
const express = require("express");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

const {
  uploadFile,
  getStoreUploads,
  viewFile,
  deleteFile,
} = require("../controllers/uploadController");

const { protectShop } = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// CUSTOMER UPLOAD
// =====================================================

router.post(
  "/:storeId",
  upload.single("file"),
  uploadFile
);

// =====================================================
// STORE FILES
// =====================================================

router.get(
  "/files/:storeId",
  protectShop,
  getStoreUploads
);

// =====================================================
// VIEW FILE
// =====================================================

router.get(
  "/files/view/:fileId",
  protectShop,
  viewFile
);

// =====================================================
// DELETE FILE
// =====================================================

router.delete(
  "/files/:fileId",
  protectShop,
  deleteFile
);

module.exports = router;

