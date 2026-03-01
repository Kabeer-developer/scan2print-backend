const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not defined");
  } else {
    console.log("DataBase Connected Succesfully");
  }

  await mongoose.connect(process.env.MONGO_URI);
};

module.exports = connectDB;
