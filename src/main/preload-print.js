const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('printAPI', {
  print: () => ipcRenderer.invoke('print-window'),
});
