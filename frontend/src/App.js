// ─────────────────────────────────────────────────────────────
//  App.js — Router Setup
//
//  React Router v6 handles which page to show based on URL:
//  /              → redirect to /login
//  /login         → Login page (public)
//  /auth/callback → Google SSO token handler (public)
//  /dashboard     → Dashboard (protected — requires login)
// ─────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute    from './components/PrivateRoute';
import Login           from './pages/Login';
import AuthCallback    from './pages/AuthCallback';
import Dashboard       from './pages/Dashboard';

export default function App() {
  return (
    // AuthProvider wraps everything so useAuth() works in any component
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"          element={<Login />} />
          <Route path="/auth/callback"  element={<AuthCallback />} />

          {/* Protected routes — requires JWT token */}
          <Route path="/dashboard" element={
          
              <Dashboard />
           
          } />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
