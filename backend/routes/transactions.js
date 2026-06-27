// ─────────────────────────────────────────────────────────────
//  transactions.js — Transaction CRUD Routes
//
//  GET    /api/transactions        — list all (with filters)
//  POST   /api/transactions        — create new transaction
//  GET    /api/transactions/:id    — get one
//  DELETE /api/transactions/:id    — delete one
// ─────────────────────────────────────────────────────────────

const express     = require('express');
const router      = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// ── GET /api/transactions ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, flagged, category, status } = req.query;
    const filter = { userId: req.user._id };

    if (flagged === 'true')  filter.isFlagged = true;
    if (category)            filter.category  = category;
    if (status)              filter.status    = status;

    const transactions = await Transaction
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      transactions,
      pagination: {
        total, page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching transactions.' });
  }
});

// ── POST /api/transactions ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { type, amount, description, recipient, category, currency } = req.body;

    // Simple AI fraud detection rules
    let isFlagged  = false;
    let flagReason = '';
    let riskScore  = 0;

    if (Math.abs(amount) > 50000) {
      riskScore += 40;
      flagReason = 'Large transaction amount';
    }
    if (!recipient || recipient.toLowerCase().includes('unknown')) {
      riskScore += 35;
      flagReason += ' · Unknown recipient';
      isFlagged = true;
    }
    if (riskScore >= 40) isFlagged = true;

    const transaction = await Transaction.create({
      userId: req.user._id,
      type, amount, description, recipient,
      category: category || type + 's',
      currency: currency || 'USD',
      isFlagged,
      flagReason: flagReason.trim(),
      riskScore,
    });

    res.status(201).json({ success: true, transaction });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating transaction.' });
  }
});

// ── GET /api/transactions/:id ──────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id, userId: req.user._id,
    });
    if (!transaction) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error.' });
  }
});

// ── DELETE /api/transactions/:id ───────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error.' });
  }
});

module.exports = router;
