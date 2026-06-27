// ─────────────────────────────────────────────────────────────
//  AuthContext.js — Global Authentication State
//
//  WHAT IS CONTEXT?
//  Context lets you share data (like the logged-in user)
//  with ANY component in your app WITHOUT passing props
//  through every level. It's like a global variable for React.
//
//  HOW TO USE IN ANY COMPONENT:
//  import { useAuth } from '../context/AuthContext';
//  const { user, login, logout } = useAuth();
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the Provider — wraps your whole app
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // checking if already logged in

  // On app load: check if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('finsight_token');
    if (token) {
      // Set default auth header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch current user profile
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch logged-in user from backend
  const fetchMe = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
    } catch {
      // Token invalid or expired — clear it
      localStorage.removeItem('finsight_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Login with email + password
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, user } = res.data;

    localStorage.setItem('finsight_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  // Register new account
  const register = async (name, email, password, company) => {
    const res = await axios.post('/api/auth/register', { name, email, password, company });
    const { token, user } = res.data;

    localStorage.setItem('finsight_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  // Handle Google SSO token (called from /auth/callback page)
  const loginWithToken = async (token) => {
    localStorage.setItem('finsight_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await fetchMe();
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('finsight_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Custom hook — easy way to use context
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
