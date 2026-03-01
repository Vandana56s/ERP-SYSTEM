// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [email,    setEmail]    = useState('admin@erp.io');
  const [password, setPassword] = useState('admin123');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">NEXUS<span>ERP</span></div>
        <div className="login-sub">Enterprise Resource Platform</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="form-error" style={{ marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            {loading ? <span className="spinner" /> : 'Sign In →'}
          </button>
        </form>

        <div className="login-hint">
          <strong style={{ color: 'var(--text-secondary)' }}>
            Demo Accounts:
          </strong><br />
          admin@erp.io / admin123<br />
          finance@erp.io / finance123<br />
          hr@erp.io / hr123<br />
          viewer@erp.io / viewer123
        </div>
      </div>
    </div>
  );
}