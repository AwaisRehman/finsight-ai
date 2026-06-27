// ─────────────────────────────────────────────────────────────
//  db.js — MongoDB Connection
//
//  mongoose.connect() opens a persistent connection to MongoDB.
//  We call this once in server.js when the app starts.
//  All models then use this shared connection automatically.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // stop the server if DB fails
  }
};

module.exports = connectDB;
