// src/pages/analytics/AnalyticsPage.jsx
import { useState, useEffect } from 'react';
import { analyticsAPI, financeAPI, employeeAPI, inventoryAPI } from '../../services/api';
import { StatCard, ProgressRow } from '../../components/common';
import { fmtCurrency } from '../../utils/format';

const COLORS = [
  'var(--accent-blue)',   'var(--accent-cyan)',
  'var(--accent-purple)', 'var(--accent-amber)',
  'var(--accent-green)',  'var(--accent-red)',
];

export default function AnalyticsPage() {
  const [dash,    setDash]    = useState(null);
  const [fStats,  setFStats]  = useState(null);
  const [eStats,  setEStats]  = useState(null);
  const [iStats,  setIStats]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.dashboard(),
      financeAPI.stats(),
      employeeAPI.stats(),
      inventoryAPI.stats(),
    ]).then(([d, f, e, i]) => {
      setDash(d.data);
      setFStats(f.data);
      setEStats(e.data);
      setIStats(i.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const revenue  = Number(fStats?.summary?.total_revenue  || 0);
  const expenses = Number(fStats?.summary?.total_expenses || 0);
  const margin   = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0;
  const empCount = Number(eStats?.summary?.total || 1);

  const maxDepSal = Math.max(...(eStats?.departments || []).map(d => Number(d.payroll) || 0), 1);
  const maxCatRev = Math.max(...(fStats?.byCategory  || []).map(c => Number(c.revenue) || 0), 1);
  const maxInvVal = Math.max(...(iStats?.byCategory  || []).map(c => Number(c.value)   || 0), 1);
  const maxExpCat = Math.max(...(fStats?.byCategory  || []).map(c => Number(c.expenses)|| 0), 1);

  return (
    <div>
      {/* KPI Row */}
      <div className="stat-grid mb-6">
        <StatCard label="Profit Margin"       value={`${margin}%`}                          color="blue"  icon="📊" sub={margin > 30 ? 'Healthy margin' : 'Watch closely'} />
        <StatCard label="Revenue / Employee"  value={fmtCurrency(revenue / empCount)}       color="cyan"  icon="🏆" sub="Productivity indicator" />
        <StatCard label="Avg Salary"          value={fmtCurrency(eStats?.summary?.avg_salary)} color="amber" icon="💸" sub="Across all departments" />
        <StatCard label="Net Income"          value={fmtCurrency(revenue - expenses)}       color="green" icon="💰" sub="Total P&L" />
      </div>

      <div className="grid-2 mb-6">
        <div className="chart-wrap">
          <div className="chart-title">Payroll by Department</div>
          {(eStats?.departments || []).map((d, i) => (
            <ProgressRow
              key={d.department}
              label={d.department}
              value={Number(d.payroll)}
              max={maxDepSal}
              color={COLORS[i % COLORS.length]}
              displayValue={fmtCurrency(d.payroll)}
            />
          ))}
        </div>

        <div className="chart-wrap">
          <div className="chart-title">Revenue by Category</div>
          {(fStats?.byCategory || []).filter(c => c.revenue).map((c, i) => (
            <ProgressRow
              key={c.category}
              label={c.category}
              value={Number(c.revenue)}
              max={maxCatRev}
              color={COLORS[i % COLORS.length]}
              displayValue={fmtCurrency(c.revenue)}
            />
          ))}
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="chart-wrap">
          <div className="chart-title">Expenses by Category</div>
          {(fStats?.byCategory || []).filter(c => c.expenses).map(c => (
            <ProgressRow
              key={c.category}
              label={c.category}
              value={Number(c.expenses)}
              max={maxExpCat}
              color="var(--accent-red)"
              displayValue={fmtCurrency(c.expenses)}
            />
          ))}
        </div>

        <div className="chart-wrap">
          <div className="chart-title">Inventory Value by Category</div>
          {(iStats?.byCategory || []).map((c, i) => (
            <ProgressRow
              key={c.category}
              label={c.category}
              value={Number(c.value)}
              max={maxInvVal}
              color={COLORS[i % COLORS.length]}
              displayValue={fmtCurrency(c.value)}
            />
          ))}
        </div>
      </div>

      {/* Monthly Trend Table */}
      {dash?.trend?.length > 0 && (
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-title">Monthly Revenue vs Expenses</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {[...dash.trend].reverse().map((t, i) => {
                const net = Number(t.revenue) - Number(t.expenses);
                return (
                  <tr key={i}>
                    <td className="text-mono text-sm">{t.label}</td>
                    <td className="text-green text-mono" style={{ fontWeight: 600 }}>
                      {fmtCurrency(t.revenue)}
                    </td>
                    <td className="text-red text-mono">{fmtCurrency(t.expenses)}</td>
                    <td
                      className={`text-mono ${net >= 0 ? 'text-green' : 'text-red'}`}
                      style={{ fontWeight: 700 }}
                    >
                      {net >= 0 ? '+' : ''}{fmtCurrency(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}