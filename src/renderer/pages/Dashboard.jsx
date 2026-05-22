// src/renderer/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  FileText,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { formatCurrency } from '../utils/formatter';
import { getElectronAPI } from '../utils/electronAPI';

function Dashboard({ projectId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadStats();
    }
  }, [projectId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const api = getElectronAPI();
      if (!api) {
        setError('Electron API tidak tersedia');
        return;
      }
      const result = await api.getProjectStats(projectId);
      if (result.success) {
        setStats(result.data);
        setError(null);
      } else {
        setError('Gagal memuat data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Pilih Proyek
          </h2>
          <p className="text-gray-500">
            Silakan pilih proyek dari sidebar untuk melihat dashboard
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <p>Error: {error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Ringkasan keuangan proyek</p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Pemasukan"
          value={formatCurrency(stats.totalIncome)}
          icon={<TrendingUp className="text-green-600" />}
          trend="positive"
        />
        <StatCard
          title="Total Pengeluaran"
          value={formatCurrency(stats.totalExpense)}
          icon={<TrendingDown className="text-red-600" />}
          trend="negative"
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(stats.balance)}
          icon={<DollarSign className="text-blue-600" />}
          trend={stats.balance >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Total Pajak"
          value={formatCurrency(stats.totalTax)}
          icon={<FileText className="text-amber-600" />}
        />
        <StatCard
          title="Pajak Tertunggak"
          value={formatCurrency(stats.unpaidTax)}
          icon={<AlertCircle className="text-orange-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pengeluaran per Kategori
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(stats.expenseByCategory).map(([name, value]) => ({
                  name,
                  value,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'].map(
                  (color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  )
                )}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Status Budget
          </h2>
          <div className="space-y-4">
            {stats.budgetStatus.map((budget) => (
              <div key={budget.category}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {budget.category}
                  </span>
                  <span className="text-sm text-gray-600">
                    {budget.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      parseInt(budget.percentage) > 100
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(parseInt(budget.percentage), 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{formatCurrency(budget.spent)}</span>
                  <span>{formatCurrency(budget.allocated)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm">Total Transaksi</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.transactionCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm">Total Pajak</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.taxCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm">Status Proyek</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">Aktif</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
