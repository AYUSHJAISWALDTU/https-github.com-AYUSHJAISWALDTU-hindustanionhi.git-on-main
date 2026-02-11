const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * Handles Vercel serverless cold starts with cached connections
 */
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((m) => {
      console.log(`✅ MongoDB connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
