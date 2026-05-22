const { contextBridge, ipcRenderer } = require('electron');

console.log('╔════════════════════════════════════════╗');
console.log('║    PRELOAD SCRIPT EXECUTING...        ║');
console.log('╚════════════════════════════════════════╝');

console.log('Checking Electron modules...');
console.log('  - contextBridge:', typeof contextBridge);
console.log('  - ipcRenderer:', typeof ipcRenderer);

// Verify modules exist
if (!contextBridge) {
  console.error('✗ FATAL: contextBridge is not available!');
  throw new Error('contextBridge module not found');
}

if (!ipcRenderer) {
  console.error('✗ FATAL: ipcRenderer is not available!');
  throw new Error('ipcRenderer module not found');
}

console.log('✓ Both modules available, proceeding...');

try {
  const electronAPI = {
    createProject: (data) => ipcRenderer.invoke('db:createProject', data),
    getProjects: () => ipcRenderer.invoke('db:getProjects'),
    getProjectById: (projectId) => ipcRenderer.invoke('db:getProjectById', projectId),
    updateProject: (data) => ipcRenderer.invoke('db:updateProject', data),
    createTransaction: (data) => ipcRenderer.invoke('db:createTransaction', data),
    getTransactions: (projectId) => ipcRenderer.invoke('db:getTransactions', projectId),
    updateTransaction: (data) => ipcRenderer.invoke('db:updateTransaction', data),
    deleteTransaction: (transactionId) => ipcRenderer.invoke('db:deleteTransaction', transactionId),
    createBudget: (data) => ipcRenderer.invoke('db:createBudget', data),
    getBudgets: (projectId) => ipcRenderer.invoke('db:getBudgets', projectId),
    createTax: (data) => ipcRenderer.invoke('db:createTax', data),
    getTaxes: (projectId) => ipcRenderer.invoke('db:getTaxes', projectId),
    updateTaxStatus: (data) => ipcRenderer.invoke('db:updateTaxStatus', data),
    recordPayment: (data) => ipcRenderer.invoke('db:recordPayment', data),
    getProjectStats: (projectId) => ipcRenderer.invoke('db:getProjectStats', projectId),
    print: (html) => ipcRenderer.invoke('print', html),
  };

  console.log('Exposing API to main world with', Object.keys(electronAPI).length, 'methods...');
  contextBridge.exposeInMainWorld('electron', electronAPI);
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║  ✓ PRELOAD SCRIPT LOADED SUCCESSFULLY  ║');
  console.log('║  ✓ window.electron is now available   ║');
  console.log('╚════════════════════════════════════════╝');
} catch (error) {
  console.error('╔════════════════════════════════════════╗');
  console.error('║  ✗ PRELOAD SCRIPT FAILED               ║');
  console.error('╚════════════════════════════════════════╝');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  throw error;
}
