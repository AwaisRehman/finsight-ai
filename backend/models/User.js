// ─────────────────────────────────────────────────────────────
//  User.js — MongoDB User Model
//
//  A "model" defines the shape of data stored in MongoDB.
//  Think of it like a table definition in SQL.
//
//  This user can:
//  - Register with email + password (authType: 'local')
//  - Login with Google SSO (authType: 'google')
//  - Both (linked accounts)
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({

  // Basic info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },

  // Password (null for Google-only users)
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // don't return password in queries by default
  },

  // Google SSO
  googleId: { type: String, default: null },
  photo:    { type: String, default: '' },

  // Auth type: 'local' | 'google' | 'both'
  authType: {
    type: String,
    enum: ['local', 'google', 'both'],
    default: 'local',
  },

  // Role-based access control
  role: {
    type: String,
    enum: ['admin', 'analyst', 'viewer'],
    default: 'analyst',
  },

  // Company/org info
  company:    { type: String, default: '' },
  department: { type: String, default: '' },

  // Account status
  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date },

}, {
  timestamps: true, // adds createdAt and updatedAt automatically
});

// ── HOOK: Hash password before saving ─────────────────────
// This runs automatically before every .save() call
// If password wasn't changed, skip hashing
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── METHOD: Compare password ───────────────────────────────
// Used in auth routes: user.matchPassword(enteredPassword)
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── VIRTUAL: Full profile (no password) ───────────────────
UserSchema.methods.toPublicJSON = function() {
  return {
    id:         this._id,
    name:       this.name,
    email:      this.email,
    photo:      this.photo,
    role:       this.role,
    company:    this.company,
    authType:   this.authType,
    lastLogin:  this.lastLogin,
    createdAt:  this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
