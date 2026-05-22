// src/renderer/pages/Transactions.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import FormTransaksi from '../components/FormTransaksi';
import { formatCurrency, formatDate } from '../utils/formatter';
import { getElectronAPI } from '../utils/electronAPI';

function Transactions({ projectId }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadTransactions();
    }
  }, [projectId]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const api = getElectronAPI();
      if (!api) {
        console.error('Electron API tidak tersedia');
        return;
      }
      const result = await api.getTransactions(projectId);
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.vendorName && t.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredTransactions(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const handleSave = async (data) => {
    try {
      const api = getElectronAPI();
      if (!api) {
        console.error('Electron API tidak tersedia');
        return;
      }
      if (editingId) {
        const result = await api.updateTransaction({
          ...data,
          id: editingId,
          projectId,
        });
        if (result.success) {
          await loadTransactions();
          setEditingId(null);
          setShowForm(false);
        }
      } else {
        const result = await api.createTransaction({
          ...data,
          projectId,
        });
        if (result.success) {
          await loadTransactions();
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      try {
        const api = getElectronAPI();
        if (!api) {
          console.error('Electron API tidak tersedia');
          return;
        }
        const result = await api.deleteTransaction(id);
        if (result.success) {
          await loadTransactions();
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditingData(transaction);
    setShowForm(true);
  };

  const getTypeLabel = (type) => {
    const labels = {
      material: '🛠️ Material',
      labor: '👷 Jasa Kerja',
      tax: '🏛️ Pajak',
      expense: '💸 Pengeluaran',
      income: '💰 Pemasukan',
    };
    return labels[type] || type;
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (!projectId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Silakan pilih proyek terlebih dahulu
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-gray-600 mt-1">Kelola material, pengeluaran, dan pajak</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tambah Transaksi
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <FormTransaksi
          projectId={projectId}
          transactionId={editingId}
          initialData={editingData}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
            setEditingData(null);
          }}
        />
      )}

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">Semua Tipe</option>
          <option value="material">Material</option>
          <option value="labor">Jasa Kerja</option>
          <option value="tax">Pajak</option>
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada transaksi ditemukan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Tanggal</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Tipe</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Kategori</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Deskripsi</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-900">Jumlah</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4">
                      {getTypeLabel(transaction.type)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(
                          transaction.paymentStatus
                        )}`}
                      >
                        {transaction.paymentStatus === 'paid'
                          ? 'Lunas'
                          : transaction.paymentStatus === 'pending'
                          ? 'Menunggu'
                          : 'Sebagian'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="inline-block p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="inline-block p-1 text-red-600 hover:bg-red-50 rounded ml-2"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Total Pemasukan</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(
                filteredTransactions
                  .filter((t) => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {formatCurrency(
                filteredTransactions
                  .filter((t) => t.type !== 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Total Transaksi</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {filteredTransactions.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
