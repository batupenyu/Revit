import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Receipt, PiggyBank, FileText, BarChart3, Plus, X } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Proyek' },
  { to: '/transactions', icon: Receipt, label: 'Transaksi' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/tax', icon: FileText, label: 'Pajak' },
  { to: '/reports', icon: BarChart3, label: 'Laporan' },
];

function Sidebar({ projects, currentProject, onProjectSelect, onCreateProject, isOpen }) {
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', budgetTotal: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    await onCreateProject({ ...newProject, budgetTotal: parseFloat(newProject.budgetTotal) || 0 });
    setNewProject({ name: '', description: '', budgetTotal: '' });
    setShowForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 bg-indigo-900 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-indigo-700">
        <h1 className="text-lg font-bold">🏗️ Budget Renovasi</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                isActive ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Projects */}
      <div className="p-4 border-t border-indigo-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-indigo-300 uppercase">Proyek</span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-indigo-300 hover:text-white"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-3 space-y-2">
            <input
              type="text"
              placeholder="Nama proyek"
              value={newProject.name}
              onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
              className="w-full px-2 py-1 text-xs bg-indigo-800 border border-indigo-600 rounded text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
              required
            />
            <input
              type="number"
              placeholder="Total budget"
              value={newProject.budgetTotal}
              onChange={e => setNewProject(p => ({ ...p, budgetTotal: e.target.value }))}
              className="w-full px-2 py-1 text-xs bg-indigo-800 border border-indigo-600 rounded text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              className="w-full py-1 text-xs bg-indigo-500 hover:bg-indigo-400 rounded transition"
            >
              Buat Proyek
            </button>
          </form>
        )}

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => onProjectSelect(p.id)}
              className={`w-full text-left px-2 py-1 rounded text-xs truncate transition ${
                currentProject === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-300 hover:bg-indigo-800'
              }`}
            >
              {p.name}
            </button>
          ))}
          {projects.length === 0 && (
            <p className="text-xs text-indigo-400">Belum ada proyek</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
