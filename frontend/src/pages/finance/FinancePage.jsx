// src/pages/finance/FinancePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { financeAPI } from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { StatCard, Toast, Modal, ConfirmModal } from '../../components/common';
import { fmtCurrency, fmtDate } from '../../utils/format';

const CATEGORIES = ['Sales','Licensing','Services','Operations','Technology','Marketing','Payroll','Other'];
const EMPTY_FORM  = { type: 'Revenue', description: '', amount: '', category: 'Sales', status: 'Pending', date: '' };

export default function FinancePage() {
  const { can }    = usePermission();
  const canEdit    = can('finance') || can('all');

  const [transactions, setTx]      = useState([]);
  const [stats,        setStats]   = useState(null);
  const [loading,      setLoading] = useState(true);
  const [typeFilter,   setType]    = useState('');
  const [showModal,    setModal]   = useState(false);
  const [editItem,     setEdit]    = useState(null);
  const [deleteId,     setDelete]  = useState(null);
  const [form,         setForm]    = useState(EMPTY_FORM);
  const [toast,        setToast]   = useState('');
  const [saving,       setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, statRes] = await Promise.all([
        financeAPI.getAll({ type: typeFilter }),
        financeAPI.stats(),
      ]);
      setTx(txRes.data.data);
      setStats(statRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEdit(null); setForm(EMPTY_FORM); setModal(true); }
  function openEdit(t) {
    setEdit(t);
    setForm({ ...t, amount: Math.abs(t.amount), date: t.date?.slice(0, 10) || '' });
    setModal(true);
  }

  async function handleSave() {
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      if (editItem) {
        await financeAPI.update(editItem.id, form);
        setToast('Transaction updated!');
      } else {
        await financeAPI.create(form);
        setToast('Transaction recorded!');
      }
      setModal(false);
      load();
    } catch (e) {
      setToast(e.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await financeAPI.delete(deleteId);
      setToast('Deleted.');
      setDelete(null);
      load();
    } catch {
      setToast('Delete failed.');
    }
  }

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div>
      <div className="stat-grid mb-6">
        <StatCard label="Total Revenue"  value={fmtCurrency(stats?.summary?.total_revenue)}  color="green"  icon="💵" />
        <StatCard label="Total Expenses" value={fmtCurrency(stats?.summary?.total_expenses)} color="red"    icon="📤" />
        <StatCard label="Net Income"     value={fmtCurrency(stats?.summary?.net_income)}     color="cyan"   icon="📈" />
        <StatCard label="Pending"        value={stats?.summary?.pending_count || 0}           color="amber"  icon="⏳" sub="Awaiting settlement" />
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">General Ledger</div>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ width: 130 }}
              value={typeFilter}
              onChange={e => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option>Revenue</option>
              <option>Expense</option>
            </select>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                + New Transaction
              </button>
            )}
          </div>
        </div>

        {loading
          ? <div className="loading"><div className="spinner" /></div>
          : (
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0
                  ? <tr><td colSpan={7} className="table-empty">No transactions found.</td></tr>
                  : transactions.map(t => (
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
                      {canEdit && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDelete(t.id)}>Del</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )
        }
      </div>

      {showModal && (
        <Modal
          title={editItem ? 'Edit Transaction' : 'Record Transaction'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Save'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={f('type')}>
                <option>Revenue</option>
                <option>Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={f('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="form-input" value={form.description} onChange={f('description')} placeholder="Invoice #1234 — Acme Corp" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount ($) *</label>
              <input className="form-input" type="number" value={form.amount} onChange={f('amount')} placeholder="15000" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={f('status')}>
                <option>Pending</option>
                <option>Settled</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={f('date')} />
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmModal
          message="Delete this transaction? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDelete(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}