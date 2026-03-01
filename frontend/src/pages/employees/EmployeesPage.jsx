// src/pages/employees/EmployeesPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { employeeAPI } from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { StatCard, Toast, Modal, ConfirmModal } from '../../components/common';
import { fmtCurrency, fmtDate } from '../../utils/format';

const DEPTS  = ['Engineering','Finance','HR','Sales','Marketing','Operations','Legal'];
const STATUS = ['Active','On Leave','Inactive','Terminated'];
const EMPTY_FORM = {
  name: '', email: '', department: 'Engineering',
  role: '', salary: '', status: 'Active', joined_at: ''
};

export default function EmployeesPage() {
  const { can }    = usePermission();
  const isAdmin    = can('all');

  const [employees,  setEmployees]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [deptFilter, setDept]       = useState('');
  const [showModal,  setModal]      = useState(false);
  const [editItem,   setEdit]       = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [toast,      setToast]      = useState('');
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, statRes] = await Promise.all([
        employeeAPI.getAll({ search, department: deptFilter }),
        employeeAPI.stats(),
      ]);
      setEmployees(empRes.data.data);
      setStats(statRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEdit(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEdit(emp) {
    setEdit(emp);
    setForm({ ...emp, joined_at: emp.joined_at?.slice(0, 10) || '' });
    setModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.role) return;
    setSaving(true);
    try {
      if (editItem) {
        await employeeAPI.update(editItem.id, form);
        setToast('Employee updated!');
      } else {
        await employeeAPI.create(form);
        setToast('Employee added!');
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
      await employeeAPI.delete(deleteId);
      setToast('Employee removed.');
      setDeleteId(null);
      load();
    } catch {
      setToast('Delete failed.');
    }
  }

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div>
      <div className="stat-grid mb-6">
        <StatCard label="Total Employees" value={stats?.summary?.total    || 0} color="blue"   icon="👥" />
        <StatCard label="Active"          value={stats?.summary?.active   || 0} color="green"  icon="✅" />
        <StatCard label="On Leave"        value={stats?.summary?.on_leave || 0} color="amber"  icon="🌴" />
        <StatCard label="Total Payroll"   value={fmtCurrency(stats?.summary?.total_payroll || 0)} color="purple" icon="💸" />
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">All Employees</div>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="search-box">
              <span style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input
                placeholder="Search name, email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-input"
              style={{ width: 140 }}
              value={deptFilter}
              onChange={e => setDept(e.target.value)}
            >
              <option value="">All Depts</option>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                + Add Employee
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
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Joined</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0
                  ? <tr><td colSpan={7} className="table-empty">No employees found.</td></tr>
                  : employees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="user-avatar">{emp.avatar}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                            <div className="text-muted text-sm">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{emp.department}</span></td>
                      <td className="text-muted text-sm">{emp.role}</td>
                      <td className="text-mono" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {fmtCurrency(emp.salary)}
                      </td>
                      <td>
                        <span className={`badge badge-${emp.status === 'Active' ? 'green' : 'amber'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="text-muted text-sm text-mono">{fmtDate(emp.joined_at)}</td>
                      {isAdmin && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(emp.id)}>Del</button>
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
          title={editItem ? 'Edit Employee' : 'Add New Employee'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : editItem ? 'Update' : 'Add Employee'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={f('name')} placeholder="Jane Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="jane@company.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department} onChange={f('department')}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Role / Title *</label>
              <input className="form-input" value={form.role} onChange={f('role')} placeholder="Senior Engineer" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Annual Salary ($)</label>
              <input className="form-input" type="number" value={form.salary} onChange={f('salary')} placeholder="90000" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={f('status')}>
                {STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Join Date</label>
            <input className="form-input" type="date" value={form.joined_at} onChange={f('joined_at')} />
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmModal
          message="Are you sure you want to remove this employee? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}