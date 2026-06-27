// ─────────────────────────────────────────────────────────────
//  seed.js — Populate MongoDB with Test Data
//
//  Run with: npm run seed
//  This creates a test user + 50 sample transactions
//  so you can see the dashboard working immediately
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const mongoose    = require('mongoose');
const User        = require('../models/User');
const Transaction = require('../models/Transaction');

const DESCRIPTIONS = [
  'Wire Transfer — Goldman Sachs', 'Aramco B2B Payment', 'FX Conversion EUR/SAR',
  'Institutional Deposit', 'Retail Payment — Vendor', 'Investment Fund Transfer',
  'Salary Disbursement', 'Equipment Purchase', 'Software License Payment',
  'Wire Transfer — Unknown Recipient', 'Rapid Cash Withdrawal', 'Overseas Transfer',
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  // Clear existing data
  await User.deleteMany({});
  await Transaction.deleteMany({});

  // Create demo user
  const user = await User.create({
    name:     'Awais Rehman',
    email:    'awais@finsight.ai',
    password: 'password123',
    company:  'FinSight AI',
    role:     'admin',
    authType: 'local',
  });
  console.log('✅ Demo user created:', user.email);
  console.log('   Password: password123');

  // Create 60 sample transactions spread over last 10 months
  const txns = [];
  for (let i = 0; i < 60; i++) {
    const daysAgo  = Math.floor(Math.random() * 300);
    const date     = new Date(); date.setDate(date.getDate() - daysAgo);
    const isCredit = Math.random() > 0.4;
    const amount   = isCredit
      ? Math.floor(Math.random() * 500000) + 10000
      : -(Math.floor(Math.random() * 100000) + 5000);
    const desc     = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
    const flagged  = desc.includes('Unknown') || desc.includes('Rapid');
    const cats     = ['transfers', 'payments', 'investments', 'withdrawals'];

    txns.push({
      userId:      user._id,
      type:        isCredit ? 'deposit' : 'transfer',
      amount,
      description: desc,
      recipient:   flagged ? 'Unknown Recipient' : 'Verified Entity',
      category:    cats[Math.floor(Math.random() * cats.length)],
      isFlagged:   flagged,
      flagReason:  flagged ? 'Suspicious recipient or pattern' : '',
      riskScore:   flagged ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30),
      status:      'completed',
      createdAt:   date,
    });
  }

  await Transaction.insertMany(txns);
  console.log(`✅ ${txns.length} transactions created`);
  console.log('\n🚀 Seed complete! Run: npm run dev');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
