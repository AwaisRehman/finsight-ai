# FinSight AI — Intelligent Fintech Analytics Dashboard

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-purple.svg)

> **A real-time AI-powered financial analytics dashboard** combining MongoDB, Node.js, React, and Groq's LLaMA 3.3 70B model for intelligent transaction analysis, fraud detection, and revenue forecasting.

---

## 📌 Research Paper

This project accompanies the research paper:

**"FinSight AI: A Real-Time Financial Analytics Dashboard Integrating Large Language Models with NoSQL Databases for Intelligent Fraud Detection and Revenue Forecasting"**

> Submitted to International Journal of Advanced Computer Science and Applications (IJACSA) · 2026

---

## 🚀 Live Demo

| Credential | Value |
|---|---|
| Email | `awais@finsight.ai` |
| Password | `password123` |

---

## ✨ Features

- 🤖 **AI Financial Analyst** — Ask natural language questions about your real transaction data, powered by Groq LLaMA 3.3 70B
- 🛡️ **Fraud Detection** — Rule-based + AI risk scoring on every transaction (0–100)
- 📈 **Revenue Forecasting** — 10-month trend analysis with AI-generated forecasts
- 📊 **Portfolio Risk** — Real-time risk score calculated from live MongoDB data
- 🔄 **Transaction Management** — Full CRUD with category, status, and fraud filters
- 🔐 **JWT Authentication** — Secure login + Google OAuth SSO
- 💬 **Conversation History** — Multi-turn AI chat with context memory

---

## 🏗️ System Architecture

```
┌─────────────────┐     REST API      ┌──────────────────┐
│   React 18      │ ◄───────────────► │  Express.js      │
│   Frontend      │                   │  Backend         │
│   (Port 3000)   │                   │  (Port 5000)     │
└─────────────────┘                   └────────┬─────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                    ┌─────────▼──────┐ ┌───────▼──────┐ ┌──────▼──────┐
                    │  MongoDB Atlas │ │  Groq API    │ │  Google     │
                    │  (Transactions,│ │  LLaMA 3.3   │ │  OAuth 2.0  │
                    │   Users)       │ │  70B         │ │             │
                    └────────────────┘ └──────────────┘ └─────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Recharts, Axios |
| **Backend** | Node.js, Express.js, JWT, Passport.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **AI Model** | Groq API — LLaMA 3.3 70B Versatile (free) |
| **Auth** | JWT + Google OAuth 2.0 |
| **Charts** | Recharts (Area, Bar, Line, Pie) |

---

## 📁 Project Structure

```
finsight-full/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── passport.js         # Google OAuth config
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT protection
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── Transaction.js      # Transaction schema + risk scoring
│   ├── routes/
│   │   ├── auth.js             # Login, register, Google SSO
│   │   ├── dashboard.js        # KPIs, revenue, anomalies
│   │   ├── transactions.js     # CRUD + filtering
│   │   └── ai.js               # Groq LLM integration
│   ├── seeders/
│   │   └── seed.js             # Demo data generator
│   ├── server.js               # Express entry point
│   └── .env.example            # Environment template
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.svg         # Custom SVG favicon
│   └── src/
│       ├── context/
│       │   └── AuthContext.js  # Global auth state
│       ├── pages/
│       │   ├── Login.js        # Auth page
│       │   ├── Dashboard.js    # Main dashboard (5 pages)
│       │   └── AuthCallback.js # Google OAuth callback
│       ├── components/
│       │   └── PrivateRoute.js # Route protection
│       └── App.js
├── LICENSE                     # MIT License
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/finsight-ai.git
cd finsight-ai
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/finsight?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your_session_secret
```

### 3. Seed demo data

```bash
npm run seed
```

### 4. Start backend

```bash
npm start
```

### 5. Frontend setup

```bash
cd ../frontend
npm install
npm start
```

### 6. Open in browser

```
http://localhost:3000
```

Login with `awais@finsight.ai` / `password123`

---

## 🤖 AI Capabilities

The AI analyst (powered by Groq LLaMA 3.3 70B) has full access to your MongoDB data and can answer:

| Category | Example Questions |
|---|---|
| Revenue | *"What was my best revenue month and why?"* |
| Fraud | *"Which transactions are most suspicious?"* |
| Risk | *"Assess my portfolio risk and give 3 recommendations"* |
| Forecast | *"Compare last 3 months and forecast next month"* |
| Categories | *"Which category is costing me the most money?"* |
| Follow-up | *"Tell me more about that flagged transaction"* |

---

## 📊 API Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login with JWT response
GET    /api/auth/google            Google OAuth redirect
GET    /api/dashboard/kpis         4 KPI cards (real MongoDB data)
GET    /api/dashboard/revenue      10-month revenue trend
GET    /api/dashboard/anomalies    Fraud vs normal by month
GET    /api/transactions           List with filters (page, flagged, category)
POST   /api/transactions           Create transaction with AI risk scoring
POST   /api/ai/analyze             LLM analysis with full data context
GET    /api/health                 Health check
```

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (salt rounds: 10)
- All routes protected with **JWT middleware**
- **CORS** configured for frontend origin only
- `.env` excluded from repository via `.gitignore`
- No API keys committed to source code

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Awais Rehman**
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- Email: awais@finsight.ai

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — Free LLaMA 3.3 70B API
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Free cloud database
- [Recharts](https://recharts.org) — React chart library
- [Meta AI](https://ai.meta.com) — LLaMA 3.3 open-source model
