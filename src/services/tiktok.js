/**
 * TikTok Service
 * 對 renderer 提供統一的 TikTok 連接介面
 * 底層透過 Electron IPC 與主程序溝通
 */

class TikTokService {
  constructor() {
    this._listeners = new Map()
  }

  /**
   * 連接到直播間
   * @param {string} uniqueId - TikTok 用戶名
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async connect(uniqueId) {
    if (!window.tiktok) {
      return { success: false, error: 'TikTok API not available' }
    }
    return await window.tiktok.connect(uniqueId)
  }

  /**
   * 中斷連線
   */
  async disconnect() {
    if (!window.tiktok) return { success: false, error: 'TikTok API not available' }
    return await window.tiktok.disconnect()
  }

  /**
   * 取得連線狀態
   */
  async status() {
    if (!window.tiktok) return { connected: false }
    return await window.tiktok.status()
  }

  /**
   * 監聽留言事件
   */
  onChat(callback) {
    window.tiktok?.onChat((data) => callback({ type: 'chat', ...data }))
  }

  /**
   * 監聽禮物事件
   */
  onGift(callback) {
    window.tiktok?.onGift((data) => callback({ type: 'gift', ...data }))
  }

  /**
   * 監聽成員進場事件
   */
  onMember(callback) {
    window.tiktok?.onMember((data) => callback({ type: 'member', ...data }))
  }

  /**
   * 監聽直播結束事件
   */
  onStreamEnd(callback) {
    window.tiktok?.onStreamEnd(() => callback())
  }

  /**
   * 監聽中斷事件
   */
  onDisconnect(callback) {
    window.tiktok?.onDisconnect(() => callback())
  }

  /**
   * 移除所有監聽
   */
  removeAllListeners() {
    window.tiktok?.removeAllListeners()
  }
}

// 單例
const tiktokService = new TikTokService()

export { TikTokService }
export default tiktokService