// ============================================================
// src/components/layout/Layout.jsx
// Shell layout — Sidebar + Topbar + Page Content
// ============================================================

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { section: 'Overview' },
  { path: '/dashboard',  label: 'Dashboard',      icon: '⬡',  permission: 'dashboard' },
  { section: 'Modules' },
  { path: '/employees',  label: 'Employees',      icon: '👥', permission: 'employees' },
  { path: '/finance',    label: 'Finance',        icon: '💰', permission: 'finance'   },
  { path: '/inventory',  label: 'Inventory',      icon: '📦', permission: 'inventory' },
  { section: 'Intelligence' },
  { path: '/analytics',  label: 'Analytics',      icon: '📈', permission: 'analytics' },
  { section: 'Admin' },
  { path: '/roles',      label: 'Roles & Access', icon: '🔒', permission: 'all'       },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Management',
  '/finance':   'Finance & Ledger',
  '/inventory': 'Inventory Management',
  '/analytics': 'Analytics & KPIs',
  '/roles':     'Roles & Permissions',
};

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const currentTitle = PAGE_TITLES[location.pathname] || 'NexusERP';

  return (
    <div className="erp-root">

      {/* ── Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          NEXUS<span>ERP</span>
          <small>Enterprise Resource Platform</small>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) => {
            // Render section label
            if (item.section) {
              return (
                <div className="sidebar-section" key={i}>
                  {item.section}
                </div>
              );
            }
            // Hide nav items user does not have permission for
            if (!hasPermission(item.permission)) return null;

            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.avatar || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.roleLabel || user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ⏻
          </button>
        </div>
      </aside>

      {/* ── Main Area */}
      <div className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">{currentTitle}</h1>
          <div className="topbar-actions">
            <span className="badge badge-blue text-mono">
              {user?.roleLabel}
            </span>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>

    </div>
  );
}