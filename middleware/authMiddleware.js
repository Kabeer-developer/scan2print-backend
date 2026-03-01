const jwt = require("jsonwebtoken");
const Shop = require("../models/Store");

const protectShop = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith("Bearer")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.shop = await Shop.findById(decoded.id).select("-password");
  if (!req.shop) {
    return res.status(401).json({ message: "Not authorized" });
  }

  next();
};

module.exports = { protectShop };
