const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User    = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'accessable-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

// Shared Google OAuth client instance
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

/* ─── Google OAuth ─── */
router.post('/google', async (req, res) => {
  const { credential, role } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required.' });
  }

  try {
    // 1. Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from Google account.' });
    }

    // 2. Find user by googleId OR email (handles account linking)
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      // Existing user — update Google fields if needed and log in
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture  = picture || user.picture;
        user.authProvider = 'google';
        await user.save();
      }
      const token = signToken(user);
      return res.json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role, picture: user.picture },
        token,
      });
    }

    // 3. New user — role is required to register
    if (!role || !['regular', 'impaired'].includes(role)) {
      return res.status(404).json({
        message: 'No account found for this Google account. Please register and choose your account type first.',
        needsRole: true,
      });
    }

    // 4. Create new Google user
    user = await User.create({
      name,
      email: email.toLowerCase(),
      password: null,
      role,
      googleId,
      picture: picture || null,
      authProvider: 'google',
    });

    const token = signToken(user);
    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, picture: user.picture },
      token,
    });
  } catch (err) {
    console.error('[auth/google] Error:', err.message);
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
      return res.status(401).json({ message: 'Google sign-in expired. Please try again.' });
    }
    if (err.name === 'MongooseServerSelectionError' || err.message?.includes('buffering timed out')) {
      return res.status(503).json({ message: 'Database is not reachable.' });
    }
    res.status(500).json({ message: 'Google authentication failed. Please try again.' });
  }
});


/* ─── Register ─── */
router.post('/register', async (req, res) => {
  console.log('[register] Request received:', { name: req.body?.name, email: req.body?.email, role: req.body?.role });
  const { name, email, password, role } = req.body;

  // Step 1: Validation
  if (!name || !email || !password || !role) {
    console.log('[register] Validation failed: missing fields');
    return res.status(400).json({ message: 'Name, email, password and role are required.' });
  }
  if (!['regular', 'impaired'].includes(role)) {
    console.log('[register] Validation failed: invalid role:', role);
    return res.status(400).json({ message: 'Role must be "regular" or "impaired".' });
  }
  console.log('[register] Validation passed');

  try {
    // Step 2: Check duplicate
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('[register] Duplicate email:', email);
      return res.status(400).json({ message: 'An account with that email already exists.' });
    }
    console.log('[register] No duplicate found');

    // Step 3: Hash password
    const hashed = await bcrypt.hash(password, 12);
    console.log('[register] Password hashed');

    // Step 4: Create user
    const user = await User.create({ name, email, password: hashed, role });
    console.log('[register] User created:', user._id.toString());

    // Step 5: Sign JWT
    const token = signToken(user);
    console.log('[register] JWT signed');

    res.status(201).json({
      user:  { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
    console.log('[register] Response sent — success');
  } catch (err) {
    console.error('[register] ERROR at step:', err.message);
    console.error('[register] Full error:', err);
    if (err.name === 'MongooseServerSelectionError' || err.message?.includes('ECONNREFUSED') || err.message?.includes('buffering timed out')) {
      return res.status(503).json({ message: 'Database is not reachable. Please ensure MongoDB is running.' });
    }
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

/* ─── Login ─── */
router.post('/login', async (req, res) => {
  console.log('[login] Request received for email:', req.body?.email);
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('[login] Validation failed: missing fields');
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Step 1: Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('[login] No user found for email:', email);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    console.log('[login] User found:', user._id.toString());

    // Step 2: Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[login] Password mismatch for user:', user._id.toString());
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    console.log('[login] Password verified');

    // Step 3: Sign JWT
    const token = signToken(user);
    console.log('[login] JWT signed — sending response');

    res.json({
      user:  { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error('[login] ERROR:', err.message);
    console.error('[login] Full error:', err);
    if (err.name === 'MongooseServerSelectionError' || err.message?.includes('ECONNREFUSED') || err.message?.includes('buffering timed out')) {
      return res.status(503).json({ message: 'Database is not reachable. Please ensure MongoDB is running.' });
    }
    res.status(500).json({ message: 'Server error during login.' });
  }
});


/* ─── Get Current User ─── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
