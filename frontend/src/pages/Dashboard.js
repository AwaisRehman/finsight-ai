// ─────────────────────────────────────────────────────────────
//  Dashboard.js — Main Dashboard Page
//
//  Fetches REAL data from MongoDB via Node.js backend.
//  Uses JWT token (set in AuthContext) for all API calls.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [kpis,         setKpis]         = useState([]);
  const [revenue,      setRevenue]      = useState([]);
  const [anomalies,    setAnomalies]    = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allTxns,      setAllTxns]      = useState([]);
  const [segmentData,  setSegmentData]  = useState([]);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [aiQuestion,   setAiQuestion]   = useState('');
  const [aiResponse,   setAiResponse]   = useState('');
  const [aiLoading,    setAiLoading]    = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [activePage,   setActivePage]   = useState('Overview');
  const [txnFilter,    setTxnFilter]    = useState('all');
  const [aiHistory, setAiHistory] = useState([]);



  const fetchAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [kpiRes, revRes, anomRes, txnRes, allRes] = await Promise.all([
        axios.get('/api/dashboard/kpis'),
        axios.get('/api/dashboard/revenue'),
        axios.get('/api/dashboard/anomalies'),
        axios.get('/api/transactions?limit=6'),
        axios.get('/api/transactions?limit=100'),
      ]);
      setKpis(kpiRes.data.kpis);
      setRevenue(revRes.data.revenue);
      setAnomalies(anomRes.data.anomalies);
      setTransactions(txnRes.data.transactions);

      // Build real segment data from MongoDB
      const all = allRes.data.transactions;
      setAllTxns(all);
      const catMap = {};
      all.forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + 1;
      });
      const colors = ['#2a78d6','#1baf7a','#eda100','#4a3aa7','#e34948','#0ea5e9'];
      const total = all.length || 1;
      const segs = Object.entries(catMap).map(([name, count], i) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round((count / total) * 100),
        color: colors[i % colors.length],
        count,
      }));
      setSegmentData(segs);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);


  const askAI = async (q) => {
  const question = q || aiQuestion;
  if (!question.trim()) return;
  setAiLoading(true);
  setAiResponse('');
  try {
    const res = await axios.post('/api/ai/analyze', {
      question,
      history: aiHistory,  // send conversation history
    });
    const answer = res.data.analysis;
    setAiResponse(answer);
    // Save to history so follow-up questions have context
    setAiHistory(prev => [
      ...prev,
      { role: 'user',      content: question },
      { role: 'assistant', content: answer   },
    ]);
    setAiQuestion('');
  } catch {
    setAiResponse('AI analysis failed. Check your GROQ_API_KEY in backend .env');
  } finally {
    setAiLoading(false);
  }
};


  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { label: 'Overview',        icon: '◎' },
    { label: 'Revenue',         icon: '📈' },
    { label: 'Transactions',    icon: '🔄' },
    { label: 'Fraud Detection', icon: '🛡️' },
    { label: 'AI Insights',     icon: '🤖' },
  ];

  const quickActions = [
    { label: '📈 Revenue Forecast', q: 'Analyze revenue trend and forecast next month with specific numbers.' },
    { label: '🛡️ Fraud Analysis',   q: 'Identify the most suspicious transactions and explain the risk.' },
    { label: '⚠️ Risk Assessment',  q: 'Assess overall portfolio risk and give 3 specific recommendations.' },
    { label: '💡 Opportunities',    q: 'What revenue opportunities or cost savings do you see in my data?' },
  ];

  const filteredTxns = txnFilter === 'all'     ? allTxns
    : txnFilter === 'flagged' ? allTxns.filter(t => t.isFlagged)
    : txnFilter === 'credit'  ? allTxns.filter(t => t.amount > 0)
    : allTxns.filter(t => t.amount < 0);

  if (dataLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0f1e' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #1a2a4a', borderTopColor:'#2a78d6', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }} />
        <p style={{ color:'#4a6080', fontSize:13, fontFamily:'Inter,sans-serif' }}>Loading MongoDB data...</p>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  // ── PAGE RENDERERS ──────────────────────────────────────

  const renderOverview = () => (
    <>
      {/* KPI Cards */}
      <div style={S.kpiGrid}>
        {kpis.map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiTop}>
              <span style={S.kpiLabel}>{k.label}</span>
              <span style={{ fontSize:20 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:28, fontWeight:700, color:'#e8f0fe', letterSpacing:'-0.03em', margin:'4px 0' }}>{k.value}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{
                fontSize:11, fontWeight:700,
                color: k.deltaUp===true ? '#1baf7a' : k.deltaUp===false ? '#e34948' : '#4a6080',
                background: k.deltaUp===true ? '#0d2a1a' : k.deltaUp===false ? '#2d1010' : '#131c2e',
                borderRadius:4, padding:'2px 7px'
              }}>
                {k.deltaUp===true ? '▲ ' : k.deltaUp===false ? '▼ ' : ''}{k.delta}
              </span>
              <span style={{ fontSize:10, color:'#4a6080' }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:16 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Revenue</div>
          <div style={S.cardSub}>Actual vs AI Forecast — real MongoDB data</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#2a78d6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1baf7a" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#1baf7a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a2a4a" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="month" tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}K`}/>
              <Tooltip contentStyle={{background:'#0f1829',border:'1px solid #1a2a4a',borderRadius:8,fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:11,color:'#6b84a8'}}/>
              <Area type="monotone" dataKey="actual"   name="Actual"      stroke="#2a78d6" fill="url(#rg)" strokeWidth={2.5} dot={false}/>
              <Area type="monotone" dataKey="forecast" name="AI Forecast" stroke="#1baf7a" fill="url(#fg)" strokeWidth={2} dot={false} strokeDasharray="5 4"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Transaction Mix</div>
          <div style={S.cardSub}>Real breakdown from MongoDB</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={segmentData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60} strokeWidth={0}>
                {segmentData.map(s => <Cell key={s.name} fill={s.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'#0f1829',border:'1px solid #1a2a4a',borderRadius:8,fontSize:12}} formatter={(v,n)=>[`${v}%`,n]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:4 }}>
            {segmentData.map(s => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:s.color, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:'#8a9ab8', flex:1 }}>{s.name}</span>
                <span style={{ fontSize:11, color:'#4a6080' }}>{s.count} txns</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#c8d8f0' }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style={S.cardTitle}>Recent Transactions</div>
            <div style={S.cardSub}>Latest 6 — AI-flagged in red</div>
          </div>
          <button style={S.linkBtn} onClick={() => setActivePage('Transactions')}>View all →</button>
        </div>
        <TxnList transactions={transactions} />
      </div>
    </>
  );

  const renderRevenue = () => (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>Revenue Trend (10 months)</div>
          <div style={S.cardSub}>Actual vs AI Forecast vs Target</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue}>
              <CartesianGrid stroke="#1a2a4a" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="month" tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}K`}/>
              <Tooltip contentStyle={{background:'#0f1829',border:'1px solid #1a2a4a',borderRadius:8,fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:11,color:'#6b84a8'}}/>
              <Line type="monotone" dataKey="actual"   name="Actual"      stroke="#2a78d6" strokeWidth={2.5} dot={{ fill:'#2a78d6', r:3 }}/>
              <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="#1baf7a" strokeWidth={2} dot={false} strokeDasharray="5 4"/>
              <Line type="monotone" dataKey="target"   name="Target"      stroke="#eda100" strokeWidth={1.5} dot={false} strokeDasharray="3 3"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Breakdown</div>
          <div style={S.cardSub}>Revenue bars by month</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenue}>
              <CartesianGrid stroke="#1a2a4a" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="month" tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}K`}/>
              <Tooltip contentStyle={{background:'#0f1829',border:'1px solid #1a2a4a',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="actual" name="Revenue" fill="#2a78d6" radius={[4,4,0,0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Month-by-Month Summary</div>
        <div style={S.cardSub}>All revenue data from MongoDB</div>
        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1a2a4a' }}>
              {['Month','Actual','AI Forecast','Target','vs Forecast'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'#4a6080', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {revenue.map((r,i) => {
              const diff = r.forecast > 0 ? (((r.actual - r.forecast) / r.forecast) * 100).toFixed(1) : 0;
              return (
                <tr key={i} style={{ borderBottom:'1px solid #0f1829' }}>
                  <td style={S.td}>{r.month}</td>
                  <td style={{ ...S.td, color:'#2a78d6', fontWeight:700 }}>${r.actual}K</td>
                  <td style={{ ...S.td, color:'#1baf7a' }}>${r.forecast}K</td>
                  <td style={{ ...S.td, color:'#eda100' }}>${r.target}K</td>
                  <td style={{ ...S.td, color: diff >= 0 ? '#1baf7a' : '#e34948', fontWeight:700 }}>{diff >= 0 ? '+' : ''}{diff}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderTransactions = () => (
    <div style={S.card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={S.cardTitle}>All Transactions</div>
          <div style={S.cardSub}>{allTxns.length} records from MongoDB</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['all','flagged','credit','debit'].map(f => (
            <button key={f} onClick={() => setTxnFilter(f)} style={{
              padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid',
              background: txnFilter===f ? '#2a78d6' : 'none',
              borderColor: txnFilter===f ? '#2a78d6' : '#1a2a4a',
              color: txnFilter===f ? '#fff' : '#4a6080',
            }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1a2a4a' }}>
              {['Description','Category','Date','Risk','Amount','Status'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'#4a6080', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTxns.map(t => (
              <tr key={t._id} style={{ borderBottom:'1px solid #0d1520', borderLeft: t.isFlagged ? '3px solid #e34948' : '3px solid transparent' }}>
                <td style={S.td}>
                  <div style={{ fontWeight:600, color:'#c8d8f0', fontSize:13 }}>{t.description}</div>
                  {t.isFlagged && <span style={S.flagBadge}>⚠️ FLAGGED</span>}
                </td>
                <td style={{ ...S.td, color:'#4a6080' }}>{t.category}</td>
                <td style={{ ...S.td, color:'#4a6080', fontSize:11 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={S.td}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:40, height:4, borderRadius:2, background:'#1a2a4a' }}>
                      <div style={{ width:`${t.riskScore}%`, height:'100%', borderRadius:2, background: t.riskScore > 60 ? '#e34948' : t.riskScore > 30 ? '#eda100' : '#1baf7a' }}/>
                    </div>
                    <span style={{ fontSize:11, color:'#4a6080' }}>{t.riskScore}</span>
                  </div>
                </td>
                <td style={{ ...S.td, fontWeight:700, color: t.amount >= 0 ? '#1baf7a' : '#e34948', fontFamily:"'JetBrains Mono',monospace" }}>
                  {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})}
                </td>
                <td style={S.td}>
                  <span style={{ fontSize:10, fontWeight:700, background:'#0d2a1a', color:'#1baf7a', borderRadius:4, padding:'2px 7px' }}>{t.status || 'completed'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTxns.length === 0 && (
          <p style={{ textAlign:'center', color:'#4a6080', fontSize:13, padding:24 }}>No transactions match this filter.</p>
        )}
      </div>
    </div>
  );

  const renderFraud = () => {
    const flagged = allTxns.filter(t => t.isFlagged);
    const avgRisk = flagged.length > 0
      ? Math.round(flagged.reduce((s,t) => s + t.riskScore, 0) / flagged.length)
      : 0;
    return (
      <>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
          {[
            { label:'Flagged Transactions', value: flagged.length, color:'#e34948', bg:'#2d1010' },
            { label:'Avg Risk Score',       value: `${avgRisk}/100`, color:'#eda100', bg:'#2a1e00' },
            { label:'Clean Transactions',   value: allTxns.length - flagged.length, color:'#1baf7a', bg:'#0d2a1a' },
          ].map(c => (
            <div key={c.label} style={{ ...S.card, background:c.bg, borderColor:c.color+'33' }}>
              <div style={{ fontSize:11, fontWeight:700, color:c.color, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontSize:32, fontWeight:700, color:c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          <div style={S.card}>
            <div style={S.cardTitle}>Fraud vs Normal by Month</div>
            <div style={S.cardSub}>Real MongoDB data</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={anomalies}>
                <CartesianGrid stroke="#1a2a4a" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month" tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#3a5070',fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#0f1829',border:'1px solid #1a2a4a',borderRadius:8,fontSize:12}}/>
                <Legend wrapperStyle={{fontSize:11,color:'#6b84a8'}}/>
                <Bar dataKey="normal"    name="Normal"    fill="#2a78d6" radius={[3,3,0,0]} opacity={0.7}/>
                <Bar dataKey="anomalies" name="Anomalies" fill="#e34948" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Risk Score Distribution</div>
            <div style={S.cardSub}>All transactions by risk level</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
              {[
                { label:'Low Risk (0–30)',    txns: allTxns.filter(t=>t.riskScore<=30),  color:'#1baf7a' },
                { label:'Medium Risk (31–60)',txns: allTxns.filter(t=>t.riskScore>30&&t.riskScore<=60), color:'#eda100' },
                { label:'High Risk (61–100)', txns: allTxns.filter(t=>t.riskScore>60),   color:'#e34948' },
              ].map(r => {
                const pct = allTxns.length > 0 ? Math.round((r.txns.length / allTxns.length) * 100) : 0;
                return (
                  <div key={r.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, color:'#8a9ab8' }}>{r.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:r.color }}>{r.txns.length} ({pct}%)</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:'#1a2a4a' }}>
                      <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:r.color, transition:'width 0.6s ease' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>⚠️ Flagged Transactions</div>
          <div style={S.cardSub}>All AI-detected suspicious activity</div>
          <TxnList transactions={flagged} />
          {flagged.length === 0 && <p style={{ color:'#1baf7a', fontSize:13, marginTop:12 }}>✅ No flagged transactions detected.</p>}
        </div>
      </>
    );
  };

  const renderAI = () => (
    <>
      <div style={{ ...S.card, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:22 }}>🤖</span>
          <div>
            <div style={S.cardTitle}>FinSight AI Financial Analyst</div>
            <div style={S.cardSub}>Analyzing your real MongoDB transaction data</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <input
            style={S.aiInput}
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            onKeyDown={e => e.key==='Enter' && askAI()}
            placeholder="Ask about your transactions, revenue, fraud patterns..."
          />
        <button style={{ ...S.aiBtn, opacity: aiLoading ? 0.6 : 1 }} onClick={() => askAI()} disabled={aiLoading}>
            {aiLoading ? '⏳' : '✨ Ask'}
          </button>
          <button
            style={{ padding:'10px 12px', background:'none', border:'1px solid #1a2a4a', borderRadius:8, color:'#4a6080', fontSize:12, cursor:'pointer' }}
            onClick={() => { setAiHistory([]); setAiResponse(''); }}
          >
            Clear
          </button>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {quickActions.map(a => (
            <button key={a.label} style={S.quickBtn} onClick={() => { setAiQuestion(a.q); askAI(a.q); }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, borderColor:'#2a78d6', borderLeftWidth:3 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span>🤖</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#2a78d6', textTransform:'uppercase', letterSpacing:'0.06em' }}>AI Response</span>
        </div>
        {aiLoading && (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:14, height:14, border:'2px solid #1a2a4a', borderTopColor:'#2a78d6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            <span style={{ fontSize:13, color:'#4a6080' }}>Reading your MongoDB data...</span>
          </div>
        )}
        {aiResponse && !aiLoading && (
          <div>
            {aiResponse.split('\n').filter(p=>p.trim()).map((p,i) => (
              <p key={i} style={{ fontSize:14, color:'#c8d8f0', lineHeight:1.8, marginBottom:10 }}>{p}</p>
            ))}
          </div>
        )}
        {!aiLoading && !aiResponse && (
          <p style={{ fontSize:13, color:'#4a6080', lineHeight:1.7 }}>
            Ask a question above and FinSight AI will analyze your real transaction data from MongoDB —
            revenue trends, fraud patterns, risk levels, and actionable recommendations.
          </p>
        )}
      </div>

      {/* Data summary card */}
      <div style={{ ...S.card, marginTop:14 }}>
        <div style={S.cardTitle}>Data in Context</div>
        <div style={S.cardSub}>What FinSight AI can see from your MongoDB</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:14 }}>
          {[
            { label:'Total Transactions', value: allTxns.length },
            { label:'Flagged',            value: allTxns.filter(t=>t.isFlagged).length },
            { label:'Total Revenue',      value: `$${(allTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0)/1000).toFixed(0)}K` },
            { label:'Categories',         value: segmentData.length },
          ].map(s => (
            <div key={s.label} style={{ background:'#0d1520', borderRadius:8, padding:'12px 14px', border:'1px solid #1a2a4a' }}>
              <div style={{ fontSize:10, color:'#4a6080', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#2a78d6' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const pages = {
    'Overview':        renderOverview,
    'Revenue':         renderRevenue,
    'Transactions':    renderTransactions,
    'Fraud Detection': renderFraud,
    'AI Insights':     renderAI,
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1e', display:'flex', flexDirection:'column', fontFamily:'Inter,sans-serif', color:'#c8d8f0' }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#0a0f1e; } ::-webkit-scrollbar-thumb { background:#1a2a4a; borderRadius:3px; }
        button:hover { filter:brightness(1.1); }
      `}</style>

      {/* TOP BAR */}
      <header style={S.topbar}>
        <div style={S.topLeft}>
          <button style={S.menuBtn} onClick={() => setSidebarOpen(x=>!x)}>☰</button>
          <svg width="38" height="38" viewBox="0 0 56 56" style={{ flexShrink:0 }}>
          <rect width="56" height="56" rx="10" fill="#0d1520" stroke="#1a3a6a" strokeWidth="1.5"/>
          <rect x="7"  y="30" width="7" height="20" rx="1.5" fill="#1a4a8a" opacity="0.7"/>
          <rect x="16" y="24" width="7" height="26" rx="1.5" fill="#2a68c0" opacity="0.85"/>
          <rect x="25" y="14" width="7" height="36" rx="1.5" fill="#2a78d6"/>
          <rect x="34" y="18" width="7" height="32" rx="1.5" fill="#1baf7a" opacity="0.9"/>
          <polyline points="7,28 16,22 25,12 34,16 43,7" fill="none" stroke="#2a78d6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="43" cy="7" r="4" fill="#1baf7a"/>
        </svg>
        <span style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.02em', color:'#e8f0fe' }}>
          Fin<span style={{ color:'#2a78d6' }}>Sight</span> <span style={{ color:'#1baf7a', fontSize:10, letterSpacing:'0.1em' }}>AI</span>
        </span>
          
          <span style={{ fontSize:9, fontWeight:700, background:'#0d2a1a', color:'#1baf7a', borderRadius:4, padding:'2px 8px', letterSpacing:'0.06em' }}>● LIVE</span>
        </div>
        <div style={S.topRight}>
          <div style={S.userChip}>
            <div style={S.avatar}>{user?.name?.[0]}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#c8d8f0' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'#1baf7a', textTransform:'uppercase', fontWeight:700 }}>{user?.role}</div>
            </div>
          </div>
          <button style={S.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside style={S.sidebar}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:'#2a3a5a', padding:'0 16px 12px', borderBottom:'1px solid #0f1829', marginBottom:8 }}>NAVIGATION</div>
            {navItems.map(item => (
              <button key={item.label} onClick={() => setActivePage(item.label)}
                style={{ ...S.navItem, ...(activePage===item.label ? S.navActive : {}) }}>
                <span style={{ fontSize:14, marginRight:10 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div style={{ margin:'auto 12px 12px', marginTop:'auto', padding:12, background:'#0d1520', border:'1px solid #1a2a4a', borderRadius:8 }}>
              <div style={{ fontSize:10, color:'#2a78d6', fontWeight:700, marginBottom:4 }}>🤖 FinSight AI</div>
              <div style={{ fontSize:11, color:'#4a6080', lineHeight:1.5 }}>Llama 3.3 70B · Real MongoDB analysis</div>
            </div>
          </aside>
        )}

        {/* MAIN */}
        <main style={S.main}>
          <div style={S.pageHead}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.03em', color:'#e8f0fe', margin:0 }}>{activePage}</h1>
              <p style={{ fontSize:12, color:'#4a6080', marginTop:4 }}>Live MongoDB · AI-powered · {user?.name}</p>
            </div>
            <button style={S.refreshBtn} onClick={fetchAllData}>↻ Refresh</button>
          </div>

          {pages[activePage]?.()}

          <div style={{ marginTop:24, paddingTop:16, borderTop:'1px solid #0f1829', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:10, color:'#2a3a5a', fontFamily:"'JetBrains Mono',monospace" }}>FinSight AI · React + Node.js + MongoDB + Groq-Llama: 3.3</span>
            <span style={{ fontSize:10, color:'#1baf7a' }}>● All systems operational</span>
          </div>
        </main>
      </div>
    </div>
  );
}

// Shared transaction list component
function TxnList({ transactions }) {
  if (!transactions || transactions.length === 0) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
      {transactions.map(t => (
        <div key={t._id} style={{
          display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
          background:'#0d1520', border:'1px solid #0f1829',
          borderLeft: `3px solid ${t.isFlagged ? '#e34948' : '#1a2a4a'}`, borderRadius:8
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#c8d8f0', display:'flex', alignItems:'center', gap:8 }}>
              {t.description}
              {t.isFlagged && <span style={{ fontSize:9, fontWeight:700, background:'#2d1010', color:'#e34948', borderRadius:4, padding:'2px 5px' }}>⚠️ FLAGGED</span>}
            </div>
            <div style={{ fontSize:11, color:'#4a6080', marginTop:2 }}>
              {t.category} · {new Date(t.createdAt).toLocaleDateString()} · Risk: {t.riskScore}/100
            </div>
          </div>
          <div style={{ fontSize:14, fontWeight:700, color: t.amount>=0 ? '#1baf7a' : '#e34948', fontFamily:"'JetBrains Mono',monospace" }}>
            {t.amount>=0?'+':''}{t.amount.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})}
          </div>
        </div>
      ))}
    </div>
  );
}

const S = {
  topbar:    { height:56, background:'#0d1520', borderBottom:'1px solid #0f1829', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', position:'sticky', top:0, zIndex:100 },
  topLeft:   { display:'flex', alignItems:'center', gap:12 },
  menuBtn:   { background:'none', border:'none', color:'#4a6080', cursor:'pointer', fontSize:18, padding:'4px 8px' },
  topRight:  { display:'flex', alignItems:'center', gap:10 },
  userChip:  { display:'flex', alignItems:'center', gap:10, background:'#0a0f1e', border:'1px solid #0f1829', borderRadius:8, padding:'6px 14px' },
  avatar:    { width:28, height:28, borderRadius:'50%', background:'#2a78d6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' },
  logoutBtn: { padding:'6px 14px', background:'none', border:'1px solid #1a2a4a', borderRadius:6, color:'#4a6080', fontSize:12, cursor:'pointer' },

  sidebar:   { width:210, background:'#0d1520', borderRight:'1px solid #0f1829', padding:'16px 0', display:'flex', flexDirection:'column', position:'sticky', top:56, height:'calc(100vh - 56px)', flexShrink:0 },
  navItem:   { width:'100%', textAlign:'left', background:'none', border:'none', borderLeft:'2px solid transparent', padding:'10px 16px', color:'#4a6080', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center' },
  navActive: { background:'#0f1829', borderLeft:'2px solid #2a78d6', color:'#2a78d6' },

  main:      { flex:1, padding:24, overflowY:'auto', background:'#0a0f1e' },
  pageHead:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  refreshBtn:{ padding:'7px 14px', background:'none', border:'1px solid #1a2a4a', borderRadius:6, color:'#4a6080', fontSize:12, cursor:'pointer' },

  kpiGrid:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 },
  kpiCard:   { background:'#0d1520', border:'1px solid #0f1829', borderRadius:12, padding:'16px 18px', display:'flex', flexDirection:'column', gap:6 },
  kpiTop:    { display:'flex', justifyContent:'space-between', alignItems:'center' },
  kpiLabel:  { fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#4a6080' },

  card:      { background:'#0d1520', border:'1px solid #0f1829', borderRadius:12, padding:'18px 20px', marginBottom:0 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#e8f0fe', marginBottom:3 },
  cardSub:   { fontSize:11, color:'#4a6080', marginBottom:0 },

  td:        { padding:'10px 12px', fontSize:12, color:'#8a9ab8', verticalAlign:'middle' },
  flagBadge: { fontSize:9, fontWeight:700, background:'#2d1010', color:'#e34948', borderRadius:4, padding:'2px 5px', marginLeft:6 },
  linkBtn:   { padding:'5px 12px', background:'none', border:'1px solid #1a2a4a', borderRadius:6, color:'#2a78d6', fontSize:12, cursor:'pointer' },

  aiInput:   { flex:1, padding:'10px 14px', background:'#0a0f1e', border:'1px solid #1a2a4a', borderRadius:8, color:'#c8d8f0', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' },
  aiBtn:     { padding:'10px 18px', background:'#2a78d6', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  quickBtn:  { padding:'6px 12px', background:'#0a0f1e', border:'1px solid #1a2a4a', borderRadius:6, color:'#4a6080', fontSize:11, cursor:'pointer' },
};