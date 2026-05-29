/**
 * Database Service (renderer side)
 * 對 renderer 提供統一的資料庫存取介面
 */

class DatabaseService {
  // Messages
  async getMessages(limit = 500, offset = 0) {
    return await window.db.getMessages(limit, offset)
  }

  async clearMessages() {
    return await window.db.clearMessages()
  }

  async exportMessages() {
    return await window.db.exportMessages()
  }

  // Keyword Rules
  async getKeywordRules() {
    return await window.db.getKeywordRules()
  }

  async addKeywordRule(keyword, autoReply = '', action = 'order') {
    return await window.db.addKeywordRule(keyword, autoReply, action)
  }

  async updateKeywordRule(id, updates) {
    return await window.db.updateKeywordRule(id, updates)
  }

  async deleteKeywordRule(id) {
    return await window.db.deleteKeywordRule(id)
  }

  // Orders
  async getOrders(limit = 200) {
    return await window.db.getOrders(limit)
  }

  async deleteOrder(id) {
    return await window.db.deleteOrder(id)
  }

  async clearOrders() {
    return await window.db.clearOrders()
  }

  async exportOrders() {
    return await window.db.exportOrders()
  }
}

const databaseService = new DatabaseService()
export { DatabaseService }
export default databaseService