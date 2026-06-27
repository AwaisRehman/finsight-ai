// ─────────────────────────────────────────────────────────────
//  authMiddleware.js — JWT Token Verification
//
//  This middleware runs BEFORE protected route handlers.
//  It checks that the request has a valid JWT token.
//
//  HOW JWT WORKS:
//  1. User logs in → server creates JWT with user ID inside
//  2. Frontend stores JWT in localStorage
//  3. Every API request sends JWT in Authorization header:
//     Authorization: Bearer eyJhbGc...
//  4. This middleware verifies the token is valid + not expired
//  5. If valid → attaches user to req.user and continues
//  6. If invalid → returns 401 Unauthorized
// ─────────────────────────────────────────────────────────────

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for "Bearer <token>"
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }

  try {
    // Verify token — throws if expired or tampered
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach full user object to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    next(); // continue to the route handler

  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

// Role-based access: authorize('admin', 'analyst')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this action.`,
    });
  }
  next();
};

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { protect, authorize, generateToken };
