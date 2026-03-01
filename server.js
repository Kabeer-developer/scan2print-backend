const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/api/store", require("./routes/storeRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || "Server error"
  });
});

app.listen(process.env.PORT || 5000,()=> console.log("SERVER RUNNING"));
