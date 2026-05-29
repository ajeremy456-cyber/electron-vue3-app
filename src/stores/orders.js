import { defineStore } from 'pinia'
import { ref } from 'vue'
import databaseService from '@/services/database'
import * as XLSX from 'xlsx'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const loading = ref(false)

  const fetchOrders = async (limit = 200) => {
    loading.value = true
    try {
      orders.value = await databaseService.getOrders(limit)
    } finally {
      loading.value = false
    }
  }

  const addOrderListener = (callback) => {
    window.tiktok?.onOrder((data) => {
      callback(data)
      // Refresh orders list
      fetchOrders()
    })
  }

  const deleteOrder = async (id) => {
    const result = await databaseService.deleteOrder(id)
    if (result) {
      orders.value = orders.value.filter(o => o.id !== id)
    }
    return result
  }

  const clearOrders = async () => {
    await databaseService.clearOrders()
    orders.value = []
  }

  const exportOrders = async () => {
    const data = await databaseService.getOrders(10000)
    if (data.length === 0) {
      alert('尚無訂單資料')
      return
    }
    // Build worksheet data with Chinese headers
    const wsData = [
      ['ID', '觸發時間', '關鍵字', '用戶暱稱', '訊息內容', '自動回覆'],
      ...data.map(o => [
        o.id,
        o.triggered_at,
        o.keyword,
        o.nickname,
        o.text,
        o.auto_reply || ''
      ])
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '準訂單')
    XLSX.writeFile(wb, `orders_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return {
    orders,
    loading,
    fetchOrders,
    addOrderListener,
    deleteOrder,
    clearOrders,
    exportOrders
  }
})