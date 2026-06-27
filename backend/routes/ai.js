// ─────────────────────────────────────────────────────────────
//  ai.js — Groq AI Analysis Route (FREE)
//
//  Groq is 100% free — uses Llama 3.3 70B model
//  Fast, powerful, no credit card needed
//
//  HOW GROQ WORKS:
//  - Same API format as OpenAI (messages array)
//  - Just different base URL and API key
//  - Model: llama-3.3-70b-versatile (very capable)
//
//  POST /api/ai/analyze
//  1. Gets question from frontend
//  2. Fetches REAL data from MongoDB
//  3. Sends data + question to Groq
//  4. Returns real AI analysis
// ─────────────────────────────────────────────────────────────

const express     = require('express');
const router      = express.Router();
const axios       = require('axios');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/analyze', async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const userId = req.user._id;

    // ── Pull ALL real data from MongoDB ───────────────────
    const [allTxns, flaggedTxns] = await Promise.all([
      Transaction.find({ userId }).sort({ createdAt: -1 }),
      Transaction.find({ userId, isFlagged: true }).sort({ riskScore: -1 }),
    ]);

    const totalTxns    = allTxns.length;
    const totalRevenue = allTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpenses= allTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const netPosition  = totalRevenue - totalExpenses;

    // Top 5 biggest credits
    const top5Credits = [...allTxns]
      .filter(t => t.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Top 5 biggest debits
    const top5Debits = [...allTxns]
      .filter(t => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 5);

    // Category breakdown with real dollar amounts
    const catStats = {};
    allTxns.forEach(t => {
      if (!catStats[t.category]) catStats[t.category] = { count: 0, total: 0 };
      catStats[t.category].count++;
      catStats[t.category].total += t.amount;
    });

    // Monthly revenue for last 6 months
    const now = new Date();
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthTxns = allTxns.filter(t => {
        const date = new Date(t.createdAt);
        return date >= start && date < end;
      });
      const credits = monthTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const debits  = monthTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      monthlyStats.push({
        month:   d.toLocaleString('default', { month: 'long' }),
        revenue: Math.round(credits),
        expenses:Math.round(debits),
        net:     Math.round(credits - debits),
        count:   monthTxns.length,
      });
    }

    // Real portfolio risk score
    const avgRisk = allTxns.length > 0
      ? Math.round(allTxns.reduce((s, t) => s + t.riskScore, 0) / allTxns.length)
      : 0;
    const highRiskCount = allTxns.filter(t => t.riskScore > 60).length;
    const riskLevel = avgRisk > 60 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW';

    // ── Build rich system prompt ───────────────────────────
    const systemPrompt = `You are an expert AI financial analyst inside FinSight AI dashboard for ${req.user.name} (${req.user.role}) at ${req.user.company || 'FinSight AI'}.

You have COMPLETE access to their real MongoDB financial database. Here is all the data:

═══ OVERALL SUMMARY ═══
- Total transactions: ${totalTxns}
- Total revenue (all credits): $${totalRevenue.toLocaleString()}
- Total expenses (all debits): $${totalExpenses.toLocaleString()}
- Net position: $${netPosition.toLocaleString()}
- Flagged/suspicious transactions: ${flaggedTxns.length} out of ${totalTxns}
- Portfolio risk level: ${riskLevel} (score: ${avgRisk}/100)
- High-risk transactions (>60 score): ${highRiskCount}

═══ MONTHLY BREAKDOWN (last 6 months) ═══
${monthlyStats.map(m =>
  `${m.month}: Revenue $${m.revenue.toLocaleString()} | Expenses $${m.expenses.toLocaleString()} | Net $${m.net.toLocaleString()} | ${m.count} transactions`
).join('\n')}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(catStats).map(([cat, s]) =>
  `${cat}: ${s.count} transactions, net $${Math.round(s.total).toLocaleString()}`
).join('\n')}

═══ TOP 5 LARGEST INCOMING ═══
${top5Credits.map(t =>
  `+$${t.amount.toLocaleString()} — ${t.description} [${t.category}] Risk:${t.riskScore}/100`
).join('\n')}

═══ TOP 5 LARGEST OUTGOING ═══
${top5Debits.map(t =>
  `-$${Math.abs(t.amount).toLocaleString()} — ${t.description} [${t.category}] Risk:${t.riskScore}/100`
).join('\n')}

═══ ALL FLAGGED/SUSPICIOUS TRANSACTIONS ═══
${flaggedTxns.length > 0
  ? flaggedTxns.map(t =>
      `⚠️ ${t.description}: $${t.amount.toLocaleString()} | Risk: ${t.riskScore}/100 | Reason: ${t.flagReason} | Date: ${new Date(t.createdAt).toLocaleDateString()}`
    ).join('\n')
  : 'No flagged transactions'
}

═══ RECENT 10 TRANSACTIONS ═══
${allTxns.slice(0, 10).map(t =>
  `${t.amount >= 0 ? '+' : ''}$${t.amount.toLocaleString()} — ${t.description} [${t.category}] ${t.isFlagged ? '⚠️ FLAGGED' : '✓'} Risk:${t.riskScore}/100 | ${new Date(t.createdAt).toLocaleDateString()}`
).join('\n')}

═══ YOUR INSTRUCTIONS ═══
- Always reference REAL numbers from the data above — never invent figures
- Give specific, actionable recommendations based on the actual data
- Be concise but insightful — 2 to 4 paragraphs
- If asked about a specific transaction or month, find it in the data and quote exact numbers
- If asked for a forecast, base it on the real monthly trend above
- Do NOT use bullet points or markdown headers in your response
- Write in a professional financial analyst tone`;

    // ── Build messages array with conversation history ─────
    // This lets follow-up questions work ("tell me more about the fraud")
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6), // keep last 6 exchanges for context
      { role: 'user', content: question },
    ];

    // ── Call Groq ──────────────────────────────────────────
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model:       'llama-3.3-70b-versatile',
        max_tokens:  1200,
        temperature: 0.5,
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type':  'application/json',
        },
      }
    );

    const aiText = response.data.choices?.[0]?.message?.content?.trim();
    if (!aiText) {
      return res.status(500).json({ success: false, message: 'No response from AI.' });
    }

    res.json({ success: true, analysis: aiText });

  } catch (err) {
    console.error('Groq AI error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.error?.message || 'AI analysis failed. Check GROQ_API_KEY in .env',
    });
  }
});

module.exports = router;