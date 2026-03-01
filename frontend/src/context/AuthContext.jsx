// ============================================================
// src/context/AuthContext.jsx
// Global authentication state using React Context.
//
// Stores: currentUser, tokens, login/logout functions
// Persists tokens to localStorage so session survives refresh
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// ✅ exported so useAuth() can access it
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load: check if we have a stored session
  useEffect(() => {
    const storedUser  = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      // ✅ Fix 1 — wrapped in try/catch so invalid JSON never crashes the app
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // If stored user data is corrupted, clear everything and start fresh
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // Login: call API, store tokens + user, update state
  async function login(email, password) {
    const { data } = await authAPI.login({ email, password });

    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user',         JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
  }

  // Logout: revoke refresh token on server, clear local storage
  async function logout() {
    const refreshToken = localStorage.getItem('refreshToken');

    // ✅ Fix 2 — removed catch(_) parameter, use plain catch instead
    try {
      await authAPI.logout({ refreshToken });
    } catch {
      // Even if server call fails, clear locally
    }

    localStorage.clear();
    setUser(null);
  }

  // Check if user has a given permission
  function hasPermission(permission) {
    if (!user) return false;
    return (
      user.permissions?.includes('all') ||
      user.permissions?.includes(permission)
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Fix 3 — AuthContext is now exported above so useContext(AuthContext) works correctly
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}