import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatter';
import { getElectronAPI } from '../utils/electronAPI';

const CATEGORIES = ['Material Bangunan', 'Jasa Kerja', 'Pajak', 'Transport', 'Perijinan', 'Lainnya'];

function BudgetManagement({ projectId }) {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: CATEGORIES[0], allocatedAmount: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) loadBudgets();
  }, [projectId]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const api = getElectronAPI();
      if (!api) return;
      const [budgetRes, txRes] = await Promise.all([
        api.getBudgets(projectId),
        api.getTransactions(projectId),
      ]);
      if (txRes.success) setTransactions(txRes.data);
      if (budgetRes.success) setBudgets(budgetRes.data);
    } finally {
      setLoading(false);
    }
  };

  // Map transaction type to budget category
  const TYPE_TO_BUDGET = {
    material: 'Material Bangunan',
    labor: 'Jasa Kerja',
    tax: 'Pajak',
    expense: 'Lainnya',
  };

  const spentByCategory = transactions
    .filter(t => t.type !== 'income')
    .reduce((acc, t) => {
      const cat = TYPE_TO_BUDGET[t.type] || t.category;
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const api = getElectronAPI();
    if (!api) {
      alert('Electron API tidak tersedia');
      return;
    }
    const result = await api.createBudget({ ...form, projectId, allocatedAmount: parseFloat(form.allocatedAmount) });
    if (result.success) {
      await loadBudgets();
      setForm({ category: CATEGORIES[0], allocatedAmount: '', notes: '' });
      setShowForm(false);
    } else {
      alert('Error: ' + result.error);
    }
  };

  if (!projectId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Silakan pilih proyek terlebih dahulu
      </div>
    );
  }

  const totalAllocated = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category] || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Budget</h1>
          <p className="text-gray-600 mt-1">Alokasi dan pantau anggaran per kategori</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" /> Tambah Budget
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Alokasi', value: formatCurrency(totalAllocated), color: 'text-blue-600' },
          { label: 'Total Terpakai', value: formatCurrency(totalSpent), color: 'text-red-600' },
          { label: 'Sisa Budget', value: formatCurrency(totalAllocated - totalSpent), color: totalAllocated - totalSpent >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Tambah Budget Kategori</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Alokasi *</label>
                <input required type="number" placeholder="0" value={form.allocatedAmount}
                  onChange={e => setForm(f => ({ ...f, allocatedAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Belum ada budget. Tambahkan alokasi budget per kategori.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => {
            const spent = spentByCategory[b.category] || 0;
            const pct = b.allocatedAmount > 0 ? (spent / b.allocatedAmount) * 100 : 0;
            const isOver = pct > 100;
            return (
              <div key={b.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">{b.category}</h3>
                  <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-gray-600'}`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Alokasi</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(b.allocatedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Terpakai</p>
                    <p className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(spent)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sisa</p>
                    <p className={`font-semibold ${b.allocatedAmount - spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(b.allocatedAmount - spent)}
                    </p>
                  </div>
                </div>
                {b.notes && <p className="text-xs text-gray-400 mt-2">{b.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BudgetManagement;
