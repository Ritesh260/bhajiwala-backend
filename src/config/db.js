const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `MongoDB Connected: ${connection.connection.host} ✅`
    );
  } catch (error) {
    console.error("MongoDB Connection Failed ❌");
    console.error(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;