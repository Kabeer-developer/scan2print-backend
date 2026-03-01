const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  registerStore,
  loginStore,
  getAllStores,
  getStoreById
} = require("../controllers/storeController");

const router = express.Router();

router.post("/register", upload.single("logo"), registerStore);
router.post("/login", loginStore);
router.get("/", getAllStores);
router.get("/:id", getStoreById);

module.exports = router;
