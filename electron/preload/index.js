import { contextBridge, ipcRenderer } from 'electron'

// 允許 renderer 調用主程序的 IPC
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // 示範 IPC 溝通
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (_, ...args) => func(...args))
})