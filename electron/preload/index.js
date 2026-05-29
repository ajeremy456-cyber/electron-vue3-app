import { contextBridge, ipcRenderer } from 'electron'

// 平台版本資訊
const api = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
}

// TikTok IPC 頻道
contextBridge.exposeInMainWorld('tiktok', {
  // 連接直播間
  connect: (uniqueId) => ipcRenderer.invoke('tiktok:connect', uniqueId),

  // 中斷連線
  disconnect: () => ipcRenderer.invoke('tiktok:disconnect'),

  // 取得連線狀態
  status: () => ipcRenderer.invoke('tiktok:status'),

  // 監聽留言
  onChat: (callback) => {
    ipcRenderer.on('tiktok:chat', (_, data) => callback(data))
  },

  // 監聽禮物
  onGift: (callback) => {
    ipcRenderer.on('tiktok:gift', (_, data) => callback(data))
  },

  // 監聽成員進場
  onMember: (callback) => {
    ipcRenderer.on('tiktok:member', (_, data) => callback(data))
  },

  // 監聽直播結束
  onStreamEnd: (callback) => {
    ipcRenderer.on('tiktok:streamEnd', (_, data) => callback(data))
  },

  // 監聽中斷
  onDisconnect: (callback) => {
    ipcRenderer.on('tiktok:disconnect', (_, data) => callback(data))
  },

  // 移除監聽
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('tiktok:chat')
    ipcRenderer.removeAllListeners('tiktok:gift')
    ipcRenderer.removeAllListeners('tiktok:member')
    ipcRenderer.removeAllListeners('tiktok:streamEnd')
    ipcRenderer.removeAllListeners('tiktok:disconnect')
  }
})

contextBridge.exposeInMainWorld('electronAPI', api)