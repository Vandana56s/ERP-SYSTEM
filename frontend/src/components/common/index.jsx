// ============================================================
// src/components/common/index.jsx
// Shared reusable UI components used across all pages
// ============================================================

import { useEffect } from 'react';

// ── Toast notification — auto dismisses after 3.5 seconds
export function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!message) return null;
  return (
    <div className="toast" onClick={onClose}>
      {message}
    </div>
  );
}

// ── Stat card — used in dashboard and module pages
export function StatCard({ label, value, icon, color = 'blue', sub, subColor }) {
  return (
    <div className={`stat-card ${color}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && (
        <div
          className="stat-sub"
          style={subColor ? { color: `var(--accent-${subColor})` } : {}}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Badge — colored label pill
export function Badge({ children, color = 'blue' }) {
  return (
    <span className={`badge badge-${color}`}>
      {children}
    </span>
  );
}

// ── Modal wrapper — closes on Escape key or clicking backdrop
export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Progress bar row — used in analytics charts
export function ProgressRow({ label, value, max, color = 'var(--accent-blue)', displayValue }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        className="flex items-center"
        style={{ justifyContent: 'space-between', marginBottom: 4 }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {displayValue || `${pct}%`}
        </span>
      </div>
      <div className="progress-wrap">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Confirm delete dialog
export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <Modal
      title="Confirm Action"
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}