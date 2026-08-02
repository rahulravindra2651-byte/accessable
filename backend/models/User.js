const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      // Optional — Google OAuth users have no password
      type: String,
      required: false,
      minlength: 6,
      default: null,
    },
    role: {
      type: String,
      enum: ['regular', 'impaired'],
      required: true,
      default: 'regular',
    },
    // Google OAuth fields
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    picture: {
      // Google profile photo URL
      type: String,
      default: null,
    },
    authProvider: {
      // 'local' | 'google'
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  {
    timestamps: true,
    collection: '6p1',
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
