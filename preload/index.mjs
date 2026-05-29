import { contextBridge, ipcRenderer } from "electron";
const api = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
};
const tiktok = {
  connect: (uniqueId) => ipcRenderer.invoke("tiktok:connect", uniqueId),
  disconnect: () => ipcRenderer.invoke("tiktok:disconnect"),
  status: () => ipcRenderer.invoke("tiktok:status"),
  onChat: (callback) => {
    ipcRenderer.on("tiktok:chat", (_, data) => callback(data));
  },
  onGift: (callback) => {
    ipcRenderer.on("tiktok:gift", (_, data) => callback(data));
  },
  onMember: (callback) => {
    ipcRenderer.on("tiktok:member", (_, data) => callback(data));
  },
  onStreamEnd: (callback) => {
    ipcRenderer.on("tiktok:streamEnd", (_, data) => callback(data));
  },
  onDisconnect: (callback) => {
    ipcRenderer.on("tiktok:disconnect", (_, data) => callback(data));
  },
  onOrder: (callback) => {
    ipcRenderer.on("tiktok:order", (_, data) => callback(data));
  },
  removeAllListeners: () => {
    ["chat", "gift", "member", "streamEnd", "disconnect", "order"].forEach((ev) => {
      ipcRenderer.removeAllListeners(`tiktok:${ev}`);
    });
  }
};
const db = {
  // Messages
  getMessages: (limit, offset) => ipcRenderer.invoke("db:getMessages", limit, offset),
  clearMessages: () => ipcRenderer.invoke("db:clearMessages"),
  exportMessages: () => ipcRenderer.invoke("db:exportMessages"),
  // Keyword Rules
  getKeywordRules: () => ipcRenderer.invoke("db:getKeywordRules"),
  addKeywordRule: (keyword, autoReply, action) => ipcRenderer.invoke("db:addKeywordRule", keyword, autoReply, action),
  updateKeywordRule: (id, updates) => ipcRenderer.invoke("db:updateKeywordRule", id, updates),
  deleteKeywordRule: (id) => ipcRenderer.invoke("db:deleteKeywordRule", id),
  // Orders
  getOrders: (limit) => ipcRenderer.invoke("db:getOrders", limit),
  deleteOrder: (id) => ipcRenderer.invoke("db:deleteOrder", id),
  clearOrders: () => ipcRenderer.invoke("db:clearOrders"),
  exportOrders: () => ipcRenderer.invoke("db:exportOrders"),
  // Blacklist
  getBlacklist: () => ipcRenderer.invoke("db:getBlacklist"),
  addToBlacklist: (nickname, reason) => ipcRenderer.invoke("db:addToBlacklist", nickname, reason),
  removeFromBlacklist: (id) => ipcRenderer.invoke("db:removeFromBlacklist", id),
  clearBlacklist: () => ipcRenderer.invoke("db:clearBlacklist"),
  exportBlacklist: () => ipcRenderer.invoke("db:exportBlacklist")
};
contextBridge.exposeInMainWorld("tiktok", tiktok);
contextBridge.exposeInMainWorld("db", db);
contextBridge.exposeInMainWorld("electronAPI", api);
