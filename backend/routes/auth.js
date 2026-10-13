const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'accessable-secret';

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

/* ─── Validation Helpers ─── */
const NAME_REGEX = /^[a-zA-Z\s'-]{2,100}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/* ─── Register ─── */
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1. Mandatory field checks
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: 'Name, email, password, and account type are required.',
    });
  }

  const trimmedName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const rawPassword = String(password);
  const normalizedRole = String(role).trim().toLowerCase();

  // 2. Full Name validation
  if (!NAME_REGEX.test(trimmedName)) {
    return res.status(400).json({
      message: 'Full Name must contain only letters, spaces, hyphens, and apostrophes (min 2 characters, no numbers).',
    });
  }

  // 3. Email format validation
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({
      message: 'Please enter a valid email address.',
    });
  }

  // 4. Password validation
  if (rawPassword.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long.',
    });
  }

  // 5. Account type validation
  if (!['regular', 'impaired'].includes(normalizedRole)) {
    return res.status(400).json({
      message: 'Account type must be either "regular" or "impaired".',
    });
  }

  try {
    // 6. Enforce ONE account type per email address:
    // Reject registration if this email is already registered under ANY role
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        message: 'This email address is already registered. Please log in using your existing account.',
      });
    }

    // 7. Hash password
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // 8. Create user with normalized values
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
    });

    // 9. Sign JWT
    const token = signToken(user);

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error('[register] ERROR:', err);
    // Gracefully handle MongoDB unique key duplicate error (code 11000)
    if (err.code === 11000 || err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(400).json({
        message: 'This email address is already registered. Please log in using your existing account.',
      });
    }
    if (
      err.name === 'MongooseServerSelectionError' ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('buffering timed out')
    ) {
      return res.status(503).json({
        message: 'Database is not reachable. Please ensure MongoDB is running.',
      });
    }
    return res.status(500).json({ message: 'Server error during registration.' });
  }
});

/* ─── Login ─── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error('[login] ERROR:', err);
    if (
      err.name === 'MongooseServerSelectionError' ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('buffering timed out')
    ) {
      return res.status(503).json({
        message: 'Database is not reachable. Please ensure MongoDB is running.',
      });
    }
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

/* ─── Get Current User ─── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
