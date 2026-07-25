const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/accessable';

  if (!process.env.MONGO_URI) {
    console.warn('[DB] Warning: MONGO_URI not set in environment. Falling back to localhost.');
    console.warn('[DB] In production (Render), set MONGO_URI in the Environment dashboard.');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('[DB] MongoDB connected successfully to:', uri.replace(/:([^@]+)@/, ':****@'));
  } catch (error) {
    console.error('[DB] MongoDB connection FAILED:', error.message);
    console.error('[DB] URI attempted:', uri.replace(/:([^@]+)@/, ':****@'));

    if (process.env.NODE_ENV === 'production') {
      console.error('[DB] Exiting process — Render will restart the service.');
      process.exit(1); // Render will auto-restart; logs will show the real error
    } else {
      console.warn('[DB] Running in development without DB — auth endpoints will fail.');
    }
  }
};

module.exports = connectDB;
