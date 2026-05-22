import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, Printer } from 'lucide-react';
import { formatCurrency } from '../utils/formatter';
import { getElectronAPI } from '../utils/electronAPI';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

function Reports({ projectId }) {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sig, setSig] = useState({
    tempat: '', tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    namaMenunggu: '', nipMenunggu: '', namaBendahara: '', nipBendahara: '',
  });

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = getElectronAPI();
      if (!api) return;
      const [statsRes, txRes] = await Promise.all([
        api.getProjectStats(projectId),
        api.getTransactions(projectId),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (txRes.success) setTransactions(txRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const api = getElectronAPI();
    const el = document.getElementById('print-area');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan Keuangan</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; padding: 24px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 8px 12px; }
      th { background: #f3f4f6; font-weight: 600; }
      td:first-child, th:first-child { text-align: center; width: 40px; }
      td:nth-child(3), td:nth-child(4), td:nth-child(5),
      th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
      tfoot td { font-weight: 700; background: #f9fafb; }
      h2 { margin-bottom: 16px; }
    </style></head><body>${el.innerHTML}</body></html>`;
    if (api) api.print(html);
    else window.print();
  };

  if (!projectId) return <div className="p-6 text-center text-gray-500">Silakan pilih proyek terlebih dahulu</div>;
  if (loading) return <div className="p-6 text-center text-gray-500">Memuat laporan...</div>;
  if (!stats) return null;

  const pieData = Object.entries(stats.expenseByCategory).map(([name, value]) => ({ name, value }));
  const budgetBarData = stats.budgetStatus.map(b => ({ name: b.category, Alokasi: b.allocated, Terpakai: b.spent }));

  let balance = 0;
  let no = 0;
  const rows = [];
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  sortedTx.forEach((tx) => {
    const isIncome = tx.type === 'income';
    const penerimaan = isIncome ? tx.amount : 0;
    const pengeluaran = isIncome ? 0 : tx.amount;
    const tanggal = new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    balance += penerimaan - pengeluaran;
    rows.push({ no: ++no, tanggal, uraian: tx.description || tx.category, penerimaan, pengeluaran, balance });

    if (tx.type === 'material') {
      const ppn = tx.amount * 0.11;
      balance += ppn;
      rows.push({ no: ++no, tanggal, uraian: `Diterima PPN 11% (${tx.description || tx.category})`, penerimaan: ppn, pengeluaran: 0, balance, isPpn: true });
      balance -= ppn;
      rows.push({ no: ++no, tanggal, uraian: `Dibayar PPN 11% (${tx.description || tx.category})`, penerimaan: 0, pengeluaran: ppn, balance, isPpn: true });
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600 mt-1">Analisis keuangan proyek</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
          <button onClick={loadData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        {[
          { label: 'Total Pemasukan', value: formatCurrency(stats.totalIncome), color: 'text-green-600' },
          { label: 'Total Pengeluaran', value: formatCurrency(stats.totalExpense), color: 'text-red-600' },
          { label: 'Total Pajak', value: formatCurrency(stats.totalTax), color: 'text-amber-600' },
          { label: 'Saldo', value: formatCurrency(stats.balance), color: stats.balance >= 0 ? 'text-blue-600' : 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {pieData.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran per Kategori</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {budgetBarData.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Realisasi</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={budgetBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Alokasi" fill="#3b82f6" />
                <Bar dataKey="Terpakai" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Signature Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 no-print">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Data Penandatangan</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'tempat', label: 'Tempat Ditetapkan' },
            { key: 'tanggal', label: 'Tanggal Ditetapkan' },
            { key: 'namaMenunggu', label: 'Nama (Mengetahui)' },
            { key: 'nipMenunggu', label: 'NIP (Mengetahui)' },
            { key: 'namaBendahara', label: 'Nama Bendahara' },
            { key: 'nipBendahara', label: 'NIP Bendahara' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={sig[key]} onChange={e => setSig(s => ({ ...s, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Print-ready Table */}
      <div id="print-area" className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Laporan Keuangan Proyek</h2>
          <span className="text-sm text-gray-500 no-print">{transactions.length} transaksi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b w-12">No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b w-28">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-b" style={{ textAlign: 'center' }}>Uraian</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">Penerimaan</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">Pengeluaran</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada transaksi</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.no} className={`border-b border-gray-100 ${row.isPpn ? 'bg-amber-50 italic text-amber-800' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-2 text-center text-gray-500">{row.no}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{row.isPpn ? '' : row.tanggal}</td>
                    <td className="px-4 py-2 text-gray-800" style={{ textAlign: 'left' }}>{row.uraian}</td>
                    <td className="px-4 py-2 text-right text-green-600">{row.penerimaan > 0 ? formatCurrency(row.penerimaan) : '-'}</td>
                    <td className="px-4 py-2 text-right text-red-600">{row.pengeluaran > 0 ? formatCurrency(row.pengeluaran) : '-'}</td>
                    <td className={`px-4 py-2 font-medium ${row.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} style={{ textAlign: 'right' }}>{formatCurrency(row.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-gray-700"></td>
                <td className="px-4 py-3 text-gray-700"></td>
                <td className="px-4 py-3 text-gray-700 font-semibold">Total</td>
                <td className="px-4 py-3 text-right text-green-700">{formatCurrency(stats.totalIncome)}</td>
                <td className="px-4 py-3 text-right text-red-700">{formatCurrency(stats.totalExpense)}</td>
                <td className={`px-4 py-3 ${stats.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`} style={{ textAlign: 'right' }}>{formatCurrency(stats.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '32px 24px 24px', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p className="font-semibold">Mengetahui,</p>
            <div style={{ height: 64 }}></div>
            <p className="font-semibold">{sig.namaMenunggu || '___________________'}</p>
            <p className="text-sm text-gray-500" style={{ marginTop: 0 }}>NIP. {sig.nipMenunggu || '_______________'}</p>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p>{sig.tempat || '_____________'}, {sig.tanggal}</p>
            <p className="font-semibold">Bendahara,</p>
            <div style={{ height: 64 }}></div>
            <p className="font-semibold">{sig.namaBendahara || '___________________'}</p>
            <p className="text-sm text-gray-500" style={{ marginTop: 0 }}>NIP. {sig.nipBendahara || '_______________'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
