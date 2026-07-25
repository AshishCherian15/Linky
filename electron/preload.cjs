const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('linkyDesktop', {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
  updateToken: (token) => ipcRenderer.send('linky:update-token', token),
  fetchMeta: (url) => ipcRenderer.invoke('linky:fetch-meta', url),
  launchBrowser: (browser, url) => ipcRenderer.send('linky:launch-browser', { browser, url }),
  checkLink: (url) => ipcRenderer.invoke('linky:check-link', url),
  
  // Listen for links saved from the companion browser extension
  onAddShortcut: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('extension:add-shortcut', listener)
    return () => ipcRenderer.removeListener('extension:add-shortcut', listener)
  }
})
