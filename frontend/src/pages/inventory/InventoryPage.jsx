// src/pages/inventory/InventoryPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { StatCard, Toast, Modal, ConfirmModal } from '../../components/common';
import { fmtCurrency } from '../../utils/format';

const CATEGORIES = ['Hardware','Software','Furniture','Peripherals','Office Supplies','Other'];
const EMPTY_FORM  = {
  name: '', sku: '', category: 'Hardware',
  quantity: '', price: '', reorder_point: '',
  supplier: '', status: 'In Stock'
};

export default function InventoryPage() {
  const { can }   = usePermission();
  const canEdit   = can('inventory') || can('all');

  const [items,      setItems]     = useState([]);
  const [stats,      setStats]     = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState('');
  const [catFilter,  setCat]       = useState('');
  const [showModal,  setModal]     = useState(false);
  const [editItem,   setEdit]      = useState(null);
  const [deleteId,   setDelete]    = useState(null);
  const [restockId,  setRestock]   = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [form,       setForm]      = useState(EMPTY_FORM);
  const [toast,      setToast]     = useState('');
  const [saving,     setSaving]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, statRes] = await Promise.all([
        inventoryAPI.getAll({ search, category: catFilter }),
        inventoryAPI.stats(),
      ]);
      setItems(itemRes.data.data);
      setStats(statRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  function openAdd()   { setEdit(null); setForm(EMPTY_FORM); setModal(true); }
  function openEdit(i) { setEdit(i); setForm({ ...i }); setModal(true); }

  async function handleSave() {
    if (!form.name || !form.sku) return;
    setSaving(true);
    try {
      if (editItem) {
        await inventoryAPI.update(editItem.id, form);
        setToast('Item updated!');
      } else {
        await inventoryAPI.create(form);
        setToast('Item added!');
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
      await inventoryAPI.delete(deleteId);
      setToast('Item deleted.');
      setDelete(null);
      load();
    } catch {
      setToast('Delete failed.');
    }
  }

  async function handleRestock() {
    try {
      await inventoryAPI.restock(restockId, restockQty);
      setToast('Item restocked!');
      setRestock(null);
      load();
    } catch {
      setToast('Restock failed.');
    }
  }

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  const statusColor = { 'In Stock': 'green', 'Low Stock': 'amber', 'Out of Stock': 'red' };

  return (
    <div>
      <div className="stat-grid mb-6">
        <StatCard label="Total SKUs"        value={stats?.summary?.total_items  || 0}              color="blue"  icon="📦" />
        <StatCard label="Total Value"       value={fmtCurrency(stats?.summary?.total_value)}       color="cyan"  icon="💰" />
        <StatCard label="Out of Stock"      value={stats?.summary?.out_of_stock || 0}              color="red"   icon="🚫" />
        <StatCard label="Low Stock Alerts"  value={stats?.summary?.low_stock    || 0}              color="amber" icon="⚠️" />
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">Stock Registry</div>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="search-box">
              <span style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input
                placeholder="Name or SKU…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-input"
              style={{ width: 140 }}
              value={catFilter}
              onChange={e => setCat(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                + Add Item
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
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan={8} className="table-empty">No items found.</td></tr>
                  : items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div className="text-muted text-sm">{item.supplier}</div>
                      </td>
                      <td className="text-mono text-sm text-muted">{item.sku}</td>
                      <td><span className="badge badge-purple">{item.category}</span></td>
                      <td
                        className="text-mono"
                        style={{
                          fontWeight: 700,
                          color: item.quantity <= item.reorder_point
                            ? 'var(--accent-amber)'
                            : 'var(--text-primary)',
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td className="text-mono text-sm">{fmtCurrency(item.price)}</td>
                      <td className="text-mono text-sm" style={{ color: 'var(--accent-cyan)' }}>
                        {fmtCurrency(item.price * item.quantity)}
                      </td>
                      <td>
                        <span className={`badge badge-${statusColor[item.status] || 'blue'}`}>
                          {item.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                            {item.status !== 'In Stock' && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => { setRestock(item.id); setRestockQty(item.reorder_point * 2); }}
                              >
                                Restock
                              </button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={() => setDelete(item.id)}>Del</button>
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
          title={editItem ? 'Edit Item' : 'Add Inventory Item'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : editItem ? 'Update' : 'Add Item'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-input" value={form.name} onChange={f('name')} placeholder="MacBook Pro 16" />
            </div>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input className="form-input" value={form.sku} onChange={f('sku')} placeholder="MBP-M3-16" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={f('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input className="form-input" value={form.supplier} onChange={f('supplier')} placeholder="Apple Inc." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" value={form.quantity} onChange={f('quantity')} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price ($)</label>
              <input className="form-input" type="number" value={form.price} onChange={f('price')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Point (alert threshold)</label>
            <input className="form-input" type="number" value={form.reorder_point} onChange={f('reorder_point')} placeholder="10" />
          </div>
        </Modal>
      )}

      {restockId && (
        <Modal
          title="Restock Item"
          onClose={() => setRestock(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRestock(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleRestock}>Confirm Restock</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Quantity to Add</label>
            <input
              className="form-input"
              type="number"
              value={restockQty}
              onChange={e => setRestockQty(Number(e.target.value))}
            />
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmModal
          message="Delete this inventory item? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDelete(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}