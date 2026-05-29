import { defineStore } from 'pinia'
import { ref } from 'vue'
import databaseService from '@/services/database'

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
    const json = await databaseService.exportOrders()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
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