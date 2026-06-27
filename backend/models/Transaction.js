// ─────────────────────────────────────────────────────────────
//  Transaction.js — MongoDB Transaction Model
//
//  Stores real financial transactions in MongoDB.
//  Each transaction belongs to a user (userId reference).
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({

  // Link to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Transaction details
  type: {
    type: String,
    enum: ['transfer', 'payment', 'investment', 'withdrawal', 'deposit'],
    required: true,
  },
  amount:      { type: Number, required: true },      // positive = credit, negative = debit
  currency:    { type: String, default: 'USD' },
  description: { type: String, required: true },
  recipient:   { type: String, default: '' },
  reference:   { type: String, default: '' },

  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'flagged'],
    default: 'completed',
  },

  // AI fraud detection
  isFlagged:    { type: Boolean, default: false },
  flagReason:   { type: String, default: '' },
  riskScore:    { type: Number, default: 0, min: 0, max: 100 }, // AI-assessed risk 0-100

  // Category
  category: {
    type: String,
    enum: ['transfers', 'payments', 'investments', 'withdrawals'],
    required: true,
  },

  // Metadata
  channel:  { type: String, default: 'web' },   // web, mobile, api
  location: { type: String, default: '' },

}, {
  timestamps: true,
});

// Index for faster queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ isFlagged: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
