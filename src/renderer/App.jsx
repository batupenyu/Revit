import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Transactions from './pages/Transactions';
import BudgetManagement from './pages/BudgetManagement';
import TaxManagement from './pages/TaxManagement';
import Reports from './pages/Reports';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { getElectronAPI } from './utils/electronAPI';
import './index.css';

function App() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    // Comprehensive debug on app load
    console.log('%c════════════════════════════════════════', 'color: blue; font-weight: bold');
    console.log('%cAPP MOUNTED - CHECKING ELECTRON CONTEXT', 'color: blue; font-weight: bold');
    console.log('%c════════════════════════════════════════', 'color: blue; font-weight: bold');
    
    const debugData = [];
    
    // Check 1: Is this Electron?
    const isElectron = typeof require !== 'undefined' && require('electron');
    debugData.push(`Is Electron context: ${typeof require !== 'undefined' ? 'Checking...' : 'No (Node context unavailable)'}`);
    
    // Check 2: window object
    debugData.push(`typeof window: ${typeof window}`);
    debugData.push(`window exists: ${window !== undefined}`);
    
    // Check 3: window.electron
    console.log('window.electron:', window.electron);
    console.log('typeof window.electron:', typeof window.electron);
    debugData.push(`window.electron: ${window.electron ? 'EXISTS' : 'UNDEFINED'}`);
    
    // Check 4: Check for any electron-related objects
    debugData.push(`window keys containing "electron": ${Object.keys(window).filter(k => k.toLowerCase().includes('electron')).join(', ') || 'NONE'}`);
    
    // Check 5: Check __ELECTRON_DISABLE_SECURITY_WARNINGS__
    debugData.push(`__ELECTRON_DISABLE_SECURITY_WARNINGS__: ${window.__ELECTRON_DISABLE_SECURITY_WARNINGS__ ? 'Set' : 'Not set'}`);
    
    // Check 6: Check for process object
    debugData.push(`typeof process: ${typeof process}`);
    debugData.push(`process.type: ${typeof process !== 'undefined' ? process.type : 'N/A'}`);
    
    const debugString = debugData.join('\n');
    debugData.forEach(d => console.log('  ', d));
    setDebugInfo(debugString);
    
    if (!window.electron) {
      const errorMsg = 'window.electron is undefined - Preload script did not run or failed';
      console.error('%c✗ ' + errorMsg, 'color: red; font-weight: bold');
      setApiError(errorMsg);
    } else {
      console.log('%c✓ window.electron is available', 'color: green; font-weight: bold');
      console.log('Available methods:', Object.keys(window.electron));
    }
    
    console.log('%c════════════════════════════════════════', 'color: blue; font-weight: bold');
    
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const api = getElectronAPI();
      if (!api) {
        console.error('Electron API tidak tersedia');
        setApiError('Electron API not available');
        return;
      }
      const result = await api.getProjects();
      if (result.success) {
        setProjects(result.data);
        if (result.data.length > 0 && !currentProject) {
          setCurrentProject(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setApiError(error.message);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const api = getElectronAPI();
      if (!api) {
        console.error('Electron API tidak tersedia');
        return;
      }
      const result = await api.createProject(projectData);
      if (result.success) {
        await loadProjects();
        setCurrentProject(result.data.id);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">

      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onProjectSelect={setCurrentProject}
        onCreateProject={handleCreateProject}
        isOpen={sidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentProjectId={currentProject}
        />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard projectId={currentProject} />} />
            <Route path="/projects" element={<Projects projects={projects} setProjects={setProjects} onRefresh={loadProjects} />} />
            <Route path="/transactions" element={<Transactions projectId={currentProject} />} />
            <Route path="/budget" element={<BudgetManagement projectId={currentProject} />} />
            <Route path="/tax" element={<TaxManagement projectId={currentProject} />} />
            <Route path="/reports" element={<Reports projectId={currentProject} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
