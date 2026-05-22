import React, { useState } from 'react';
import { Plus, Edit, MapPin, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatter';
import { getElectronAPI } from '../utils/electronAPI';

const STATUS_LABELS = { planning: 'Perencanaan', in_progress: 'Berjalan', completed: 'Selesai' };
const STATUS_COLORS = { planning: 'bg-blue-100 text-blue-800', in_progress: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800' };

function Projects({ projects, setProjects, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', location: '', budgetTotal: '', status: 'planning', startDate: '', endDate: '' });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', location: '', budgetTotal: '', status: 'planning', startDate: '', endDate: '' });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      location: p.location || '',
      budgetTotal: p.budgetTotal || '',
      status: p.status,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, budgetTotal: parseFloat(form.budgetTotal) || 0 };
    try {
      const api = getElectronAPI();
      if (!api) {
        alert('Error: Electron API tidak tersedia. Silakan restart aplikasi.');
        return;
      }
      let result;
      if (editing) {
        result = await api.updateProject({ ...data, id: editing });
      } else {
        result = await api.createProject(data);
      }
      if (!result.success) {
        alert('Gagal menyimpan proyek: ' + (result.error || 'Unknown error'));
        console.error('Save project error:', result.error);
        return;
      }
      await onRefresh();
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert('Gagal menyimpan proyek: ' + err.message);
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proyek</h1>
          <p className="text-gray-600 mt-1">Kelola proyek renovasi Anda</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" /> Tambah Proyek
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Proyek' : 'Proyek Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Nama proyek *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <textarea placeholder="Deskripsi" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Lokasi" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input type="number" placeholder="Total Budget" value={form.budgetTotal} onChange={e => setForm(f => ({ ...f, budgetTotal: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Mulai</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Selesai</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              {editing && (
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="planning">Perencanaan</option>
                  <option value="in_progress">Berjalan</option>
                  <option value="completed">Selesai</option>
                </select>
              )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 text-lg">{p.name}</h3>
              <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-gray-400 hover:text-indigo-600">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            {p.description && <p className="text-sm text-gray-600">{p.description}</p>}
            {p.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-3 h-3" /> {p.location}
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </span>
              <span className="text-sm font-semibold text-indigo-600">{formatCurrency(p.budgetTotal)}</span>
            </div>
            {p.startDate && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" /> {formatDate(p.startDate)}
                {p.endDate && ` – ${formatDate(p.endDate)}`}
              </div>
            )}
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Belum ada proyek. Klik "Tambah Proyek" untuk memulai.
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;
