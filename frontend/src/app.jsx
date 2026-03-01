// ============================================================
// src/App.jsx
// Application Router — defines all routes and protects them
//
// ProtectedRoute  → redirects to /login if not logged in
// PermissionRoute → shows 403 if role lacks permission
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeesPage from './pages/employees/EmployeesPage';
import FinancePage from './pages/finance/FinancePage';
import InventoryPage from './pages/inventory/InventoryPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import RolesPage from './pages/roles/RolesPage';

// ── Redirect to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// ── Show 403 if user lacks required permission
function PermissionRoute({ permission, children }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return (
      <div className="loading" style={{ flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 32 }}>🔒</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>Access Denied</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Your role does not have permission to view this page.
        </span>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes — all wrapped in sidebar layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={
          <PermissionRoute permission="dashboard">
            <Dashboard />
          </PermissionRoute>
        } />

        <Route path="employees" element={
          <PermissionRoute permission="employees">
            <EmployeesPage />
          </PermissionRoute>
        } />

        <Route path="finance" element={
          <PermissionRoute permission="finance">
            <FinancePage />
          </PermissionRoute>
        } />

        <Route path="inventory" element={
          <PermissionRoute permission="inventory">
            <InventoryPage />
          </PermissionRoute>
        } />

        <Route path="analytics" element={
          <PermissionRoute permission="analytics">
            <AnalyticsPage />
          </PermissionRoute>
        } />

        <Route path="roles" element={
          <PermissionRoute permission="all">
            <RolesPage />
          </PermissionRoute>
        } />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}