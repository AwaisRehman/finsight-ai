// ─────────────────────────────────────────────────────────────
//  server.js — Express App Entry Point
//
//  This is where the Node.js server starts.
//  It wires together: Express, MongoDB, Passport, and all routes.
// ─────────────────────────────────────────────────────────────

require('dotenv').config();             // load .env variables first
const express        = require('express');
const cors           = require('cors');
const session        = require('express-session');
const passport       = require('./config/passport');
const connectDB      = require('./config/db');

// Import routes
const authRoutes         = require('./routes/auth');
const dashboardRoutes    = require('./routes/dashboard');
const transactionRoutes  = require('./routes/transactions');
const aiRoutes           = require('./routes/ai');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect MongoDB ────────────────────────────────────────
connectDB();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());                         // parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // parse form data

// Session (needed for Passport Google SSO)
app.use(session({
  secret:            process.env.SESSION_SECRET || 'secret',
  resave:            false,
  saveUninitialized: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai',           aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FinSight AI Backend running ✅', time: new Date() });
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FinSight AI Backend running on http://localhost:${PORT}`);
  console.log(`📊 API docs:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/google`);
  console.log(`   GET  http://localhost:${PORT}/api/dashboard/kpis`);
  console.log(`   POST http://localhost:${PORT}/api/ai/analyze\n`);
});
