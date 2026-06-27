// ─────────────────────────────────────────────────────────────
//  auth.js — Authentication Routes
//
//  POST /api/auth/register  — Create new account
//  POST /api/auth/login     — Email + password login
//  GET  /api/auth/google    — Start Google SSO flow
//  GET  /api/auth/google/callback — Google redirects here
//  GET  /api/auth/me        — Get logged-in user profile
//  POST /api/auth/logout    — Clear session
// ─────────────────────────────────────────────────────────────

const express       = require('express');
const router        = express.Router();
const passport      = require('passport');
const User          = require('../models/User');
const { protect, generateToken } = require('../middleware/authMiddleware');

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already taken
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user (password hashed by model pre-save hook)
    const user = await User.create({ name, email, password, company, authType: 'local' });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.toPublicJSON(),
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user — include password field (excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check password
    if (!user.password) {
      return res.status(401).json({ success: false, message: 'This account uses Google login. Please sign in with Google.' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toPublicJSON(),
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ── GET /api/auth/google ───────────────────────────────────
// Step 1: Redirect user to Google consent screen
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ── GET /api/auth/google/callback ─────────────────────────
// Step 2: Google redirects here after user consents
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`, session: false }),
  async (req, res) => {
    try {
      // Update last login
      req.user.lastLogin = new Date();
      await req.user.save();

      // Generate JWT
      const token = generateToken(req.user._id);

      // Redirect to frontend with token in URL
      // Frontend will extract it and store in localStorage
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    } catch (err) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

// ── GET /api/auth/me ───────────────────────────────────────
// Protected: get current user profile
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
});

// ── POST /api/auth/logout ──────────────────────────────────
router.post('/logout', protect, (req, res) => {
  // JWT is stateless — frontend just deletes the token
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
