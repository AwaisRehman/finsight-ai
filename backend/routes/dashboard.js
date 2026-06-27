// ─────────────────────────────────────────────────────────────
//  dashboard.js — Dashboard Data Routes
//
//  GET /api/dashboard/kpis         — 4 KPI cards
//  GET /api/dashboard/revenue      — Monthly revenue chart data
//  GET /api/dashboard/risk         — Portfolio risk breakdown
// ─────────────────────────────────────────────────────────────

const express     = require('express');
const router      = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// All dashboard routes require login
router.use(protect);

// ── GET /api/dashboard/kpis ───────────────────────────────
router.get('/kpis', async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Total revenue this month (sum of positive amounts)
    const thisMonthTxns = await Transaction.find({
      userId,
      createdAt: { $gte: thisMonthStart },
    });
    const lastMonthTxns = await Transaction.find({
      userId,
      createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
    });

    const sumPositive = (txns) => txns
      .filter(t => t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);

    const thisRevenue = sumPositive(thisMonthTxns);
    const lastRevenue = sumPositive(lastMonthTxns);
    const revenueChange = lastRevenue > 0
      ? (((thisRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1)
      : 0;

    // Transaction count
    const totalTxns    = thisMonthTxns.length;
    const lastTotalTxns = lastMonthTxns.length;
    const txnChange = lastTotalTxns > 0
      ? (((totalTxns - lastTotalTxns) / lastTotalTxns) * 100).toFixed(1)
      : 0;

    // Fraud flagged
    const fraudCount = await Transaction.countDocuments({ userId, isFlagged: true });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const newFraud   = await Transaction.countDocuments({
      userId, isFlagged: true, createdAt: { $gte: todayStart },
    });

    const allUserTxns = await Transaction.find({ userId });
    const avgRiskScore = allUserTxns.length > 0
      ? Math.round(allUserTxns.reduce((s, t) => s + t.riskScore, 0) / allUserTxns.length)
      : 0;
    const riskLabel = avgRiskScore > 60 ? 'High' : avgRiskScore > 30 ? 'Medium' : 'Low';


    res.json({
      success: true,
      kpis: [
        {
          label:    'Total Revenue',
          value:    `$${(thisRevenue / 1000).toFixed(1)}K`,
          delta:    `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`,
          deltaUp:  revenueChange >= 0,
          sub:      'vs last month',
          icon:     '💰',
        },
        {
          label:    'Transactions',
          value:    totalTxns.toLocaleString(),
          delta:    `${txnChange >= 0 ? '+' : ''}${txnChange}%`,
          deltaUp:  txnChange >= 0,
          sub:      'this month',
          icon:     '🔄',
        },
        {
          label:    'Fraud Flagged',
          value:    fraudCount.toString(),
          delta:    `${newFraud} new`,
          deltaUp:  false,
          sub:      'today · AI detected',
          icon:     '🛡️',
        },
        {
          label:    'Portfolio Risk',
          value:    riskLabel,
          delta:    `${avgRiskScore}/100`,
          deltaUp:  avgRiskScore < 30 ? true : avgRiskScore > 60 ? false : null,
          sub:      'avg risk · AI scored',
          icon:     '📊',
        },
  
      ],
    });

  } catch (err) {
    console.error('KPI error:', err);
    res.status(500).json({ success: false, message: 'Error fetching KPIs.' });
  }
});

// ── GET /api/dashboard/revenue ────────────────────────────
router.get('/revenue', async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const months = [];

    // Get last 10 months of revenue data
    for (let i = 9; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const txns = await Transaction.find({
        userId,
        createdAt: { $gte: start, $lt: end },
        amount: { $gt: 0 },
      });

      const actual = txns.reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month:    d.toLocaleString('default', { month: 'short' }),
        actual:   Math.round(actual / 1000),         // in $K
        forecast: Math.round((actual * 1.05) / 1000), // AI +5% forecast
        target:   Math.round((actual * 1.12) / 1000), // target
      });
    }

    res.json({ success: true, revenue: months });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching revenue.' });
  }
});

// ── GET /api/dashboard/anomalies ──────────────────────────
router.get('/anomalies', async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const months = [];

    for (let i = 9; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const [normal, anomalies] = await Promise.all([
        Transaction.countDocuments({ userId, createdAt: { $gte: start, $lt: end }, isFlagged: false }),
        Transaction.countDocuments({ userId, createdAt: { $gte: start, $lt: end }, isFlagged: true  }),
      ]);

      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        normal,
        anomalies,
      });
    }

    res.json({ success: true, anomalies: months });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching anomalies.' });
  }
});

module.exports = router;
