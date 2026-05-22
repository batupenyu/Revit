import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatter';
import { getElectronAPI } from '../utils/electronAPI';

const TAX_TYPES = ['PPn', 'PPh 21', 'PPh 23', 'PPh 4(2)', 'Bea Masuk', 'PBB', 'Pajak Lainnya'];
const STATUS_COLORS = { unpaid: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', overdue: 'bg-red-100 text-red-800' };
const STATUS_LABELS = { unpaid: 'Belum Bayar', paid: 'Lunas', overdue: 'Jatuh Tempo' };

function TaxManagement({ projectId }) {
  const [taxes, setTaxes] = useState([]);
  const [materialTxs, setMaterialTxs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ taxType: TAX_TYPES[0], amount: '', percentage: '', dueDate: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = getElectronAPI();
      if (!api) return;
      const [taxRes, txRes] = await Promise.all([
        api.getTaxes(projectId),
        api.getTransactions(projectId),
      ]);
      if (taxRes.success) setTaxes(taxRes.data);
      if (txRes.success) setMaterialTxs(txRes.data.filter(t => t.type === 'material'));
    } finally {
      setLoading(false);
    }
  };

  const loadTaxes = loadData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const api = getElectronAPI();
    if (!api) {
      alert('Electron API tidak tersedia');
      return;
    }
    const result = await api.createTax({ ...form, projectId, amount: parseFloat(form.amount) });
    if (result.success) {
      await loadTaxes();
      setForm({ taxType: TAX_TYPES[0], amount: '', percentage: '', dueDate: '', notes: '' });
      setShowForm(false);
    }
  };

  const handleMarkPaid = async (tax) => {
    if (!window.confirm(`Tandai ${tax.taxType} sebagai lunas?`)) return;
    const api = getElectronAPI();
    if (!api) {
      alert('Electron API tidak tersedia');
      return;
    }
    const result = await api.updateTaxStatus({
      id: tax.id,
      status: 'paid',
      paymentDate: new Date().toISOString(),
    });
    if (result.success) await loadTaxes();
  };

  if (!projectId) {
    return <div className="p-6 text-center text-gray-500">Silakan pilih proyek terlebih dahulu</div>;
  }

  const totalMaterial = materialTxs.reduce((s, t) => s + t.amount, 0);
  const totalPPN = totalMaterial * 0.11;
  const totalTax = taxes.reduce((s, t) => s + t.amount, 0);
  const unpaidTax = taxes.filter(t => t.status !== 'paid').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pajak</h1>
          <p className="text-gray-600 mt-1">Pantau dan kelola kewajiban pajak</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" /> Tambah Pajak
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Pajak</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalTax)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
          <p className="text-sm text-gray-500">Belum Dibayar</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(unpaidTax)}</p>
        </div>
      </div>

      {/* PPN Auto Calculation */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <h2 className="font-semibold text-amber-800 mb-3">PPN Otomatis dari Belanja Material (11%)</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-amber-100">
            <p className="text-xs text-gray-500">Total Belanja Material</p>
            <p className="font-bold text-gray-900 mt-1">{formatCurrency(totalMaterial)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-amber-100">
            <p className="text-xs text-gray-500">PPN Diterima (11%)</p>
            <p className="font-bold text-green-600 mt-1">{formatCurrency(totalPPN)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-amber-100">
            <p className="text-xs text-gray-500">PPN Dibayar (11%)</p>
            <p className="font-bold text-red-600 mt-1">{formatCurrency(totalPPN)}</p>
          </div>
        </div>
        {materialTxs.length > 0 && (
          <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
            <thead className="bg-amber-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-amber-900">Transaksi Material</th>
                <th className="px-3 py-2 text-right font-semibold text-amber-900">Nilai Belanja</th>
                <th className="px-3 py-2 text-right font-semibold text-amber-900">PPN Diterima</th>
                <th className="px-3 py-2 text-right font-semibold text-amber-900">PPN Dibayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {materialTxs.map(t => {
                const ppn = t.amount * 0.11;
                return (
                  <tr key={t.id}>
                    <td className="px-3 py-2 text-gray-700">{t.description || t.category}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(t.amount)}</td>
                    <td className="px-3 py-2 text-right text-green-600">{formatCurrency(ppn)}</td>
                    <td className="px-3 py-2 text-right text-red-600">{formatCurrency(ppn)}</td>
                  </tr>
                );
              })}
              <tr className="bg-amber-50 font-semibold">
                <td className="px-3 py-2 text-amber-900">Total</td>
                <td className="px-3 py-2 text-right">{formatCurrency(totalMaterial)}</td>
                <td className="px-3 py-2 text-right text-green-700">{formatCurrency(totalPPN)}</td>
                <td className="px-3 py-2 text-right text-red-700">{formatCurrency(totalPPN)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Tambah Pajak</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pajak</label>
                <select value={form.taxType} onChange={e => setForm(f => ({ ...f, taxType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  {TAX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
                  <input required type="number" placeholder="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Persentase (%)</label>
                  <input type="number" placeholder="0" value={form.percentage}
                    onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
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

      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      ) : taxes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Belum ada data pajak.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Jenis Pajak</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Jumlah</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Jatuh Tempo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {taxes.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.taxType}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(t.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{t.dueDate ? formatDate(t.dueDate) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.status !== 'paid' && (
                      <button onClick={() => handleMarkPaid(t)}
                        className="text-green-600 hover:text-green-800" title="Tandai Lunas">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TaxManagement;
