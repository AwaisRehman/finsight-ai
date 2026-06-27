// ─────────────────────────────────────────────────────────────
//  Login.js — Login & Registration Page
//
//  This is the FIRST page users see.
//  It handles 3 auth flows:
//  1. Email + Password Login
//  2. Email + Password Registration
//  3. Google SSO (one click)
// ─────────────────────────────────────────────────────────────

import { useState }           from 'react';
import { useNavigate, Link }  from 'react-router-dom';
import { useAuth }            from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate            = useNavigate();

  // Toggle between login and register forms
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Form fields
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', company: '',
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); // clear error on typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        // Register mode
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await register(form.name, form.email, form.password, form.company);
      }
      navigate('/dashboard'); // success → go to dashboard

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google SSO — redirect to backend which redirects to Google
  const handleGoogle = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div style={styles.page}>

      {/* Left panel — branding */}
      <div style={styles.leftPanel}>
        <div style={styles.brandWrap}>
          <div style={styles.logo}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <rect width="56" height="56" rx="10" fill="#0d1520" stroke="#1a3a6a" strokeWidth="1.5"/>
                  <rect x="7"  y="30" width="7" height="20" rx="1.5" fill="#1a4a8a" opacity="0.7"/>
                  <rect x="16" y="24" width="7" height="26" rx="1.5" fill="#2a68c0" opacity="0.85"/>
                  <rect x="25" y="14" width="7" height="36" rx="1.5" fill="#2a78d6"/>
                  <rect x="34" y="18" width="7" height="32" rx="1.5" fill="#1baf7a" opacity="0.9"/>
                  <polyline points="7,28 16,22 25,12 34,16 43,7" fill="none" stroke="#2a78d6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="43" cy="7" r="4" fill="#1baf7a"/>
                </svg>
              </div>
              <h1 style={styles.brandName}>
                Fin<span style={{ color:'#2a78d6' }}>Sight</span> <span style={{ color:'#1baf7a', fontSize:20, letterSpacing:'0.1em' }}>AI</span>
              </h1>
         
         
          
          <p style={styles.brandTagline}>
            AI-powered Fintech Analytics Dashboard
          </p>
        </div>

        <div style={styles.featureList}>
          {[
            { icon: '🤖', text: 'Real-time AI analysis powered by Claude' },
            { icon: '🛡️', text: 'Fraud detection & anomaly alerts' },
            { icon: '📊', text: 'Portfolio risk assessment' },
            { icon: '📈', text: 'Revenue forecasting & trends' },
          ].map(f => (
            <div key={f.text} style={styles.featureItem}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        <p style={styles.leftFooter}>
          Built with React · Node.js · MongoDB · Claude AI
        </p>
      </div>

      {/* Right panel — auth form */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          {/* Tab switcher */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Create Account
            </button>
          </div>

          <h2 style={styles.formTitle}>
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </h2>
          <p style={styles.formSub}>
            {mode === 'login'
              ? 'Sign in to your FinSight AI dashboard'
              : 'Create your free account — no credit card needed'}
          </p>

          {/* Google SSO Button */}
          <button style={styles.googleBtn} onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>

            {/* Name — only for registration */}
            {mode === 'register' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Awais Rehman"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            )}

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            {/* Company — only for registration */}
            {mode === 'register' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Company (optional)</label>
                <input
                  name="company"
                  type="text"
                  placeholder="Your company name"
                  value={form.company}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            )}

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                name="password"
                type="password"
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                value={form.password}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            {/* Confirm Password — only for registration */}
            {mode === 'register' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={styles.errorBox}>
                ❌ {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In'       : 'Create Account')}
            </button>

          </form>

          {/* Demo credentials hint */}
          {mode === 'login' && (
            <div style={styles.demoBox}>
              <strong style={{ color: 'var(--amber)' }}>Demo account:</strong>
              <br />Email: awais@finsight.ai
              <br />Password: password123
            </div>
          )}

          <p style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              style={styles.switchLink}
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
  },

  // Left panel
  leftPanel: {
    background: 'linear-gradient(135deg, #0A1628 0%, #0D2040 100%)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', padding: '60px 50px',
  },
  brandWrap: { marginBottom: 48 },
  logo: {
      marginBottom: 16,
      width: 80, height: 80,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  brandName: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 },
  brandTagline: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 },
  featureList: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 14 },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 },
  leftFooter: { fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" },

  // Right panel
  rightPanel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px',
  },
  formCard: {
    width: '100%', maxWidth: 420,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16, padding: '36px 36px',
  },

  // Tabs
  tabs: {
    display: 'flex', background: 'var(--surface-alt)',
    borderRadius: 8, padding: 4, marginBottom: 28, gap: 4,
  },
  tab: {
    flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500,
    background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 6,
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  formTitle: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 },
  formSub:   { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 },

  // Google button
  googleBtn: {
    width: '100%', padding: '11px 0',
    background: '#fff', color: '#1f1f1f',
    border: '1px solid #ddd', borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, transition: 'background 0.15s',
  },

  // Divider
  divider: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: 12, color: 'var(--text-muted)' },

  // Form
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.02em' },
  input: {
    padding: '10px 14px',
    background: 'var(--surface-alt)',
    border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text-primary)',
    fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', transition: 'border-color 0.15s',
  },

  errorBox: {
    padding: '10px 14px',
    background: '#2D1010', border: '1px solid #4A2020',
    borderRadius: 8, fontSize: 13, color: 'var(--red)',
  },

  submitBtn: {
    padding: '12px 0',
    background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    marginTop: 4, transition: 'opacity 0.15s',
    letterSpacing: '0.01em',
  },

  demoBox: {
    marginTop: 16, padding: '10px 14px',
    background: '#1A1500', border: '1px solid #3A3000',
    borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)',
    lineHeight: 1.7,
  },

  switchText: { marginTop: 20, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' },
  switchLink: {
    background: 'none', border: 'none',
    color: 'var(--accent)', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
  },
};
