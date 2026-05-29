<template>
  <div class="space-y-8">
    <!-- 🚫 黑名單 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">🚫 黑名單</h2>
          <p class="text-sm text-gray-500 mt-1">黑名單用戶的訊息不會顯示，也不會觸發訂單</p>
        </div>
        <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
          {{ blacklist.length }} 人
        </span>
      </div>

      <!-- 新增 -->
      <div class="flex gap-2 mb-5">
        <input
          v-model="newBlackNick"
          type="text"
          placeholder="用戶暱稱"
          class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          @keyup.enter="addBlack"
        />
        <input
          v-model="newBlackReason"
          type="text"
          placeholder="原因（可選）"
          class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          @keyup.enter="addBlack"
        />
        <button
          @click="addBlack"
          :disabled="!newBlackNick.trim()"
          class="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
        >
          加入
        </button>
      </div>

      <!-- 列表 -->
      <div class="space-y-2">
        <div v-if="blacklist.length === 0" class="text-center text-gray-400 py-4">
          黑名單是空的
        </div>
        <div
          v-for="user in blacklist"
          :key="user.id"
          class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
        >
          <span class="text-red-400 text-lg">🚫</span>
          <div class="flex-1">
            <span class="font-semibold text-gray-800">{{ user.nickname }}</span>
            <span v-if="user.reason" class="text-xs text-gray-400 ml-2">{{ user.reason }}</span>
          </div>
          <span class="text-xs text-gray-400">{{ user.created_at?.slice(0, 10) }}</span>
          <button
            @click="removeBlack(user.id)"
            class="text-red-400 hover:text-red-600 text-sm"
          >
            移除
          </button>
        </div>
      </div>

      <div v-if="blacklist.length > 0" class="mt-4 flex gap-2">
        <button
          @click="exportBlack"
          class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          匯出名單
        </button>
        <button
          @click="clearBlack"
          class="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
        >
          清除全部
        </button>
      </div>
    </div>

    <!-- 💬 關鍵字規則 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">💬 關鍵字規則</h2>
          <p class="text-sm text-gray-500 mt-1">訊息包含關鍵字時自動列入準訂單</p>
        </div>
        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          {{ rulesStore.rules.length }} 條規則
        </span>
      </div>

      <div class="flex gap-2 mb-5">
        <input
          v-model="newKeyword"
          type="text"
          placeholder="關鍵字（例：購買、訂購）"
          class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          @keyup.enter="addRule"
        />
        <input
          v-model="newAutoReply"
          type="text"
          placeholder="自動回覆（可選）"
          class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          @keyup.enter="addRule"
        />
        <select
          v-model="newAction"
          class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="order">列入訂單</option>
          <option value="reply">自動回覆</option>
          <option value="both">兩者皆執行</option>
        </select>
        <button
          @click="addRule"
          :disabled="!newKeyword.trim()"
          class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          新增
        </button>
      </div>

      <div class="space-y-2">
        <div v-if="rulesStore.rules.length === 0" class="text-center text-gray-400 py-6">
          尚無關鍵字規則
        </div>
        <div
          v-for="rule in rulesStore.rules"
          :key="rule.id"
          class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-gray-50"
        >
          <button
            @click="toggleRule(rule)"
            class="flex-shrink-0 w-10 h-6 rounded-full transition-colors"
            :class="rule.enabled ? 'bg-green-500' : 'bg-gray-300'"
          >
            <div
              class="w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1"
              :class="rule.enabled ? 'translate-x-5' : 'translate-x-1'"
            />
          </button>
          <div class="flex-shrink-0 min-w-[120px]">
            <span class="font-semibold text-blue-600">「{{ rule.keyword }}」</span>
          </div>
          <div class="flex-1 min-w-0">
            <span v-if="rule.auto_reply" class="text-sm text-gray-500">
              回覆：{{ rule.auto_reply }}
            </span>
            <span v-else class="text-xs text-gray-400 italic">無自動回覆</span>
          </div>
          <span class="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 flex-shrink-0">
            {{ actionLabel(rule.action) }}
          </span>
          <button @click="deleteRule(rule.id)" class="flex-shrink-0 text-red-400 hover:text-red-600 text-sm">
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 📦 準訂單 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">📦 準訂單明細</h2>
          <p class="text-sm text-gray-500 mt-1">被關鍵字觸發的訊息自動列入這裡</p>
        </div>
        <div class="flex gap-2">
          <button @click="ordersStore.fetchOrders()" class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            重新整理
          </button>
          <button @click="ordersStore.exportOrders()" class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            匯出 JSON
          </button>
          <button @click="ordersStore.clearOrders()" class="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
            清除全部
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="pb-2 font-medium">時間</th>
              <th class="pb-2 font-medium">觸發關鍵字</th>
              <th class="pb-2 font-medium">用戶</th>
              <th class="pb-2 font-medium">內容</th>
              <th class="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ordersStore.orders.length === 0">
              <td colspan="5" class="py-6 text-center text-gray-400">尚無訂單記錄</td>
            </tr>
            <tr
              v-for="order in ordersStore.orders"
              :key="order.id"
              class="border-b border-gray-50 hover:bg-gray-50"
            >
              <td class="py-2 text-gray-500">{{ order.triggered_at }}</td>
              <td class="py-2">
                <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                  {{ order.keyword }}
                </span>
              </td>
              <td class="py-2 font-medium text-gray-800">{{ order.nickname }}</td>
              <td class="py-2 text-gray-600 max-w-xs truncate">{{ order.text }}</td>
              <td class="py-2">
                <button @click="ordersStore.deleteOrder(order.id)" class="text-red-400 hover:text-red-600 text-xs">
                  刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-2 text-xs text-gray-400 text-right">
        共 {{ ordersStore.orders.length }} 筆
      </div>
    </div>

    <!-- 📊 訊息匯出 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">📊 訊息管理</h2>
      <div class="flex gap-3">
        <button @click="ordersStore.fetchOrders()" class="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
          讀取歷史訊息
        </button>
        <button @click="exportMessages" class="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
          匯出訊息 JSON
        </button>
        <button @click="clearAllMessages" class="px-5 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm">
          清除訊息
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRulesStore } from '@/stores/rules'
import { useOrdersStore } from '@/stores/orders'
import databaseService from '@/services/database'

const rulesStore = useRulesStore()
const ordersStore = useOrdersStore()

const blacklist = ref([])
const newBlackNick = ref('')
const newBlackReason = ref('')
const newKeyword = ref('')
const newAutoReply = ref('')
const newAction = ref('order')

onMounted(async () => {
  await loadBlacklist()
  rulesStore.fetchRules()
  ordersStore.fetchOrders()
  ordersStore.addOrderListener(() => {})
})

const loadBlacklist = async () => {
  blacklist.value = await databaseService.getBlacklist()
}

const addBlack = async () => {
  if (!newBlackNick.value.trim()) return
  await databaseService.addToBlacklist(newBlackNick.value.trim(), newBlackReason.value.trim())
  await loadBlacklist()
  newBlackNick.value = ''
  newBlackReason.value = ''
}

const removeBlack = async (id) => {
  await databaseService.removeFromBlacklist(id)
  await loadBlacklist()
}

const clearBlack = async () => {
  if (!confirm('確定要清除整個黑名單嗎？')) return
  await databaseService.clearBlacklist()
  await loadBlacklist()
}

const exportBlack = async () => {
  const json = await databaseService.exportBlacklist()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `blacklist_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const addRule = async () => {
  if (!newKeyword.value.trim()) return
  await rulesStore.addRule(newKeyword.value.trim(), newAutoReply.value.trim(), newAction.value)
  newKeyword.value = ''
  newAutoReply.value = ''
  newAction.value = 'order'
}

const toggleRule = async (rule) => {
  await rulesStore.toggleRule(rule.id, !rule.enabled)
}

const deleteRule = async (id) => {
  await rulesStore.deleteRule(id)
}

const actionLabel = (action) => {
  switch (action) {
    case 'order': return '列入訂單'
    case 'reply': return '自動回覆'
    case 'both': return '兩者'
    default: return action
  }
}

const exportMessages = async () => {
  const json = await databaseService.exportMessages()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `messages_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearAllMessages = async () => {
  if (confirm('確定要清除所有訊息嗎？')) {
    await databaseService.clearMessages()
    alert('已清除')
  }
}
</script>