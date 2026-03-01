// src/pages/roles/RolesPage.jsx
// Displays the RBAC configuration — Admin only

const ROLES = [
  {
    name: 'admin', label: 'Administrator', color: 'red',
    permissions: ['all modules'],
    description: 'Full unrestricted access to every module, user management, and system settings.',
    users: ['admin@erp.io'],
  },
  {
    name: 'finance_manager', label: 'Finance Manager', color: 'amber',
    permissions: ['dashboard', 'finance', 'analytics'],
    description: 'Can view the dashboard, record and manage all financial transactions, and view analytics.',
    users: ['finance@erp.io'],
  },
  {
    name: 'hr_manager', label: 'HR Manager', color: 'blue',
    permissions: ['dashboard', 'employees', 'analytics'],
    description: 'Can manage employee records, view headcount analytics, and access the dashboard.',
    users: ['hr@erp.io'],
  },
  {
    name: 'inventory_manager', label: 'Inventory Manager', color: 'green',
    permissions: ['dashboard', 'inventory', 'analytics'],
    description: 'Can manage stock levels, add SKUs, trigger restocks, and view inventory analytics.',
    users: ['inventory@erp.io'],
  },
  {
    name: 'viewer', label: 'Viewer', color: 'purple',
    permissions: ['dashboard'],
    description: 'Read-only access to the dashboard KPIs only. Cannot access any module data.',
    users: ['viewer@erp.io'],
  },
];

const permColor = {
  'all modules': 'red',
  'dashboard':   'blue',
  'finance':     'green',
  'employees':   'cyan',
  'inventory':   'amber',
  'analytics':   'purple',
};

export default function RolesPage() {
  return (
    <div>
      {/* Explainer Banner */}
      <div className="card mb-6" style={{ borderColor: 'rgba(79,142,247,0.25)', background: 'rgba(79,142,247,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 24 }}>🔒</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
            Role-Based Access Control (RBAC)
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 13 }}>
          Every user is assigned a <strong style={{ color: 'var(--text-primary)' }}>role</strong> that
          grants specific permissions. The{' '}
          <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
            authorize()
          </code>{' '}
          middleware on the backend checks the JWT payload on every API request.
        </p>
      </div>

      {/* Role Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {ROLES.map(role => (
          <div
            key={role.name}
            className="card"
            style={{ borderTop: `2px solid var(--accent-${role.color})` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                {role.label}
              </div>
              <span className={`badge badge-${role.color}`}>{role.name}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
              {role.description}
            </p>
            <div style={{ marginBottom: 12 }}>
              <div className="text-muted text-sm text-mono" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Permissions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {role.permissions.map(p => (
                  <span key={p} className={`badge badge-${permColor[p] || 'blue'}`}>{p}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-muted text-sm text-mono" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Demo Users
              </div>
              {role.users.map(u => (
                <div key={u} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {u}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          How RBAC Works in This Project
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { step: '1', title: 'Login',          desc: 'User submits email + password. bcrypt verifies the hash. Role + permissions fetched from DB.' },
            { step: '2', title: 'Token Issued',   desc: 'JWT signed with user id, email, role, and permissions array. Expires in 15 minutes.' },
            { step: '3', title: 'API Request',    desc: 'Frontend sends Bearer token. authenticate() middleware verifies signature on every request.' },
            { step: '4', title: 'Permission Check', desc: 'authorize("finance") checks if permissions includes "all" or "finance". Rejects with 403 if not.' },
          ].map(s => (
            <div
              key={s.step}
              style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                {s.step}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
