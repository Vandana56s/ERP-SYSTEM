// src/pages/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import { StatCard } from '../../components/common';
import { fmtCurrency, fmtDate } from '../../utils/format';

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data)   return <div className="loading">Failed to load dashboard.</div>;

  const { employees, finance, inventory, trend = [], departments = [], recentTx = [] } = data;
  const maxRevenue = Math.max(...trend.map(t => Number(t.revenue) || 0), 1);
  const colors = [
    'var(--accent-blue)', 'var(--accent-cyan)',   'var(--accent-purple)',
    'var(--accent-amber)','var(--accent-green)',   'var(--accent-red)',
  ];

  return (
    <div>
      {/* ── KPI Cards */}
      <div className="stat-grid mb-6">
        <StatCard label="Total Revenue"        value={fmtCurrency(finance?.revenue)}    icon="💵" color="green"  sub="All settled transactions" />
        <StatCard label="Total Expenses"       value={fmtCurrency(finance?.expenses)}   icon="📤" color="red"    sub="Operating costs" />
        <StatCard label="Net Income"           value={fmtCurrency(finance?.net_income)} icon="📈" color="cyan"   sub="Revenue minus expenses" />
        <StatCard label="Active Employees"     value={employees?.active}                icon="👥" color="blue"   sub={`of ${employees?.total} total`} />
        <StatCard label="Inventory Value"      value={fmtCurrency(inventory?.value)}   icon="📦" color="amber"  sub={`${inventory?.total} SKUs tracked`} />
        <StatCard label="Pending Transactions" value={finance?.pending_tx}              icon="⏳" color="purple" sub="Awaiting settlement" />
      </div>

      {/* ── Charts Row */}
      <div className="grid-2 mb-6">

        {/* Revenue Bar Chart */}
        <div className="chart-wrap">
          <div className="chart-title">Revenue Trend</div>
          {trend.length > 0 ? (
            <div className="bar-chart">
              {trend.map((t, i) => (
                <div className="bar-col" key={i}>
                  <div
                    className="bar"
                    style={{
                      height: `${(Number(t.revenue) / maxRevenue) * 100}%`,
                      background: i === trend.length - 1
                        ? 'var(--accent-blue)'
                        : 'var(--bg-elevated)',
                      border: i === trend.length - 1
                        ? 'none'
                        : '1px solid var(--border-bright)',
                    }}
                    title={fmtCurrency(t.revenue)}
                  />
                  <span className="bar-label">{t.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No trend data available.</p>
          )}
        </div>

        {/* Department Headcount Chart */}
        <div className="chart-wrap">
          <div className="chart-title">Headcount by Department</div>
          {departments.map((d, i) => {
            const pct = employees?.total > 0
              ? Math.round((d.count / employees.total) * 100)
              : 0;
            return (
              <div key={d.department} style={{ marginBottom: 12 }}>
                <div
                  className="flex"
                  style={{ justifyContent: 'space-between', marginBottom: 4 }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {d.department}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {d.count} · {pct}%
                  </span>
                </div>
                <div className="progress-wrap">
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Recent Transactions */}
      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">Recent Transactions</div>
          <span className="badge badge-blue">Latest 5</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentTx.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.description}</td>
                <td>
                  <span className={`badge badge-${t.type === 'Revenue' ? 'green' : 'red'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="text-muted text-sm">{t.category}</td>
                <td
                  className={`text-mono ${Number(t.amount) >= 0 ? 'text-green' : 'text-red'}`}
                  style={{ fontWeight: 600 }}
                >
                  {Number(t.amount) >= 0 ? '+' : ''}{fmtCurrency(t.amount)}
                </td>
                <td>
                  <span className={`badge badge-${t.status === 'Settled' ? 'green' : 'amber'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="text-muted text-sm text-mono">{fmtDate(t.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}