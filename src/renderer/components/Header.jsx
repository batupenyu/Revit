import React from 'react';
import { Menu, Printer } from 'lucide-react';
import { getElectronAPI } from '../utils/electronAPI';

function Header({ onToggleSidebar, currentProjectId }) {
  const handlePrint = () => {
    const api = getElectronAPI();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cetak</title>
    <style>body{font-family:Arial,sans-serif;font-size:13px;padding:24px;}</style>
    </head><body>${document.body.innerHTML}</body></html>`;
    if (api) api.print(html);
    else window.print();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
      <button onClick={onToggleSidebar} className="text-gray-500 hover:text-gray-700" aria-label="Toggle sidebar">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1" />
      {!currentProjectId && (
        <span className="text-sm text-amber-600 font-medium">⚠️ Pilih proyek dari sidebar</span>
      )}
      <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50" title="Cetak halaman (Ctrl+P)">
        <Printer className="w-4 h-4" /> Cetak
      </button>
    </header>
  );
}

export default Header;
