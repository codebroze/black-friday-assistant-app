const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  searchDeals: (query, category) => ipcRenderer.invoke('search-deals', { query, category }),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  checkApiKey: (provider) => ipcRenderer.invoke('check-api-key', provider)
});
