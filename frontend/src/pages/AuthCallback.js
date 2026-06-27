// ─────────────────────────────────────────────────────────────
//  AuthCallback.js — Google SSO Callback Handler
//
//  After Google login, backend redirects to:
//  http://localhost:3000/auth/callback?token=eyJ...
//
//  This page:
//  1. Extracts the JWT token from the URL
//  2. Stores it via AuthContext
//  3. Redirects to dashboard
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const error  = params.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      loginWithToken(token).then(() => {
        navigate('/dashboard');
      });
    } else {
      navigate('/login');
    }
  }, []);

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
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Completing Google sign-in...
        </p>
      </div>
    </div>
  );
}
