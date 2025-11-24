const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  searchDeals: (query, category) => ipcRenderer.invoke('search-deals', { query, category })
});
