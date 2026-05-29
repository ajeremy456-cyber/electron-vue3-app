<template>
  <div>
    <div v-if="exp" class="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm opacity-80">試用版剩餘天數</div>
          <div class="text-4xl font-bold mt-1">{{ exp.remaining }} <span class="text-lg font-normal opacity-80">天</span></div>
          <div class="text-sm opacity-80 mt-1">已使用 {{ exp.elapsed }} / {{ exp.totalDays }} 天</div>
        </div>
        <div class="text-6xl">⏱️</div>
      </div>
      <div class="mt-3 bg-white/20 rounded-full h-2">
        <div class="bg-white rounded-full h-2 transition-all" :style="{ width: Math.max(0, (exp.remaining / exp.totalDays) * 100) + '%' }"></div>
      </div>
      <div class="text-xs opacity-80 mt-2">試用期 14 天，過期後程式將無法啟動</div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="text-3xl mb-2">📺</div>
        <div class="text-2xl font-bold text-gray-800">{{ chatStore.messageCount }}</div>
        <div class="text-gray-500 text-sm">收到的訊息</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="text-3xl mb-2">💬</div>
        <div class="text-2xl font-bold text-gray-800">{{ chatStore.currentRoom || '-' }}</div>
        <div class="text-gray-500 text-sm">目前直播間</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="text-3xl mb-2">{{ chatStore.isConnected ? '🟢' : '⚪' }}</div>
        <div class="text-2xl font-bold text-gray-800">{{ chatStore.isConnected ? '已連接' : '未連接' }}</div>
        <div class="text-gray-500 text-sm">連線狀態</div>
      </div>
    </div>

    <div class="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 class="text-lg font-semibold mb-4">系統資訊</h3>
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-gray-600">應用程式版本</span>
          <span class="font-medium">v1.0.0</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-600">Electron 版本</span>
          <span class="font-medium">{{ versions.electron || 'N/A' }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-600">Node 版本</span>
          <span class="font-medium">{{ versions.node || 'N/A' }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-600">平台</span>
          <span class="font-medium">{{ platform }}</span>
        </div>
      </div>
    </div>

    <div class="mt-8 bg-blue-50 rounded-xl shadow-sm p-6 border border-blue-100">
      <h3 class="text-lg font-semibold mb-2 text-blue-800">💡 使用說明</h3>
      <ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
        <li>到 <strong>LiveChat</strong> 頁面</li>
        <li>輸入 TikTok 直播間帳號（例：t7vomg9）</li>
        <li>點擊 <strong>連接</strong> 按鈕</li>
        <li>開始接收直播間的即時留言、禮物、成員進場訊息</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const versions = window.electronAPI?.versions || {}
const platform = window.electronAPI?.platform || 'unknown'
const exp = ref(null)

onMounted(async () => {
  try {
    exp.value = await window.db?.getExpiration()
  } catch (e) {
    console.error('Failed to load expiration:', e)
  }
})
</script>