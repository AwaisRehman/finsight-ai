// ─────────────────────────────────────────────────────────────
//  PrivateRoute.js — Protect Pages from Unauthenticated Users
//
//  Wrap any page with <PrivateRoute> to require login.
//  If user is not logged in → redirect to /login automatically.
//
//  USAGE in App.js:
//  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
// ─────────────────────────────────────────────────────────────

import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking if user is logged in (checking localStorage token)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading FinSight AI...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login page
  if (!user) return <Navigate to="/login" replace />;

  // Logged in → show the protected page
  return children;
}
