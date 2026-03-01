const Store = require("../models/Store");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");
const generateQRCode = require("../utils/generateQRCode");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => (result ? resolve(result) : reject(err))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const registerStore = async (req, res, next) => {
  try {
    const { name, location, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await Store.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let logoUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "store_logos");
      logoUrl = result.secure_url;
    }

    const store = await Store.create({
      name,
      location,
      email,
      password,
      logoUrl
    });

    store.qrCodeUrl = await generateQRCode(
      `${process.env.FRONTEND_URL}/store/${store._id}`
    );
    await store.save();

    res.status(201).json({
      store: {
        id: store._id,
        name: store.name,
        email: store.email,
        logoUrl: store.logoUrl,
        qrCodeUrl: store.qrCodeUrl
      },
      token: generateToken(store._id)
    });
  } catch (err) {
    next(err);
  }
};

const loginStore = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const store = await Store.findOne({ email });
    if (!store || !(await store.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        email: store.email,
        logoUrl: store.logoUrl,
        qrCodeUrl: store.qrCodeUrl
      },
      token: generateToken(store._id)
    });
  } catch (err) {
    next(err);
  }
};

const getAllStores = async (req, res, next) => {
  try {
    const keyword = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    const stores = await Store.find(keyword).select(
      "name location logoUrl qrCodeUrl"
    );
    res.json(stores);
  } catch (err) {
    next(err);
  }
};

const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).select(
      "name location logoUrl qrCodeUrl"
    );
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.json(store);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerStore,
  loginStore,
  getAllStores,
  getStoreById
};
