<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex gap-3">
      <input
        v-model="roomId"
        type="text"
        placeholder="輸入直播間用戶名..."
        class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        :disabled="chatStore.isConnected"
        @keyup.enter="handleConnect"
      />
      <button
        @click="handleConnect"
        :disabled="chatStore.isConnected || !roomId.trim()"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {{ chatStore.isConnected ? '已連接' : '連接' }}
      </button>
      <button
        v-if="chatStore.isConnected"
        @click="handleDisconnect"
        class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        中斷
      </button>
    </div>

    <!-- Chat Messages -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-1">
      <div v-if="chatStore.messages.length === 0" class="text-center text-gray-400 mt-10">
        尚無留言，連接直播間後開始接收訊息
      </div>
      <div
        v-for="msg in chatStore.messages"
        :key="msg.id"
        class="flex gap-3 py-1.5 px-2 rounded hover:bg-gray-50"
        :class="msg.type === 'system' ? 'bg-blue-50 border border-blue-100' : ''"
      >
        <!-- Icon -->
        <span class="text-lg flex-shrink-0 w-6 text-center">
          {{ getIcon(msg.type) }}
        </span>
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-blue-600" :class="msg.type === 'system' ? 'text-blue-500' : ''">
              {{ msg.nickname }}
            </span>
            <span class="text-gray-400 text-xs">{{ msg.time }}</span>
          </div>
          <div class="text-gray-800 text-sm break-words">{{ msg.text }}</div>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="p-3 border-t border-gray-200 bg-gray-50 text-sm flex justify-between">
      <span :class="chatStore.isConnected ? 'text-green-600' : 'text-gray-400'">
        {{ chatStore.isConnected ? '🟢 已連接到 @' + chatStore.currentRoom : '⚪ 未連接' }}
      </span>
      <span class="text-gray-500">共 {{ chatStore.messageCount }} 條訊息</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const roomId = ref('')
const chatContainer = ref(null)

// Auto-scroll to bottom when new messages arrive
watch(
  () => chatStore.messages.length,
  () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
)

const handleConnect = async () => {
  if (!roomId.value.trim() || chatStore.isConnected) return
  await chatStore.connect(roomId.value.trim())
}

const handleDisconnect = async () => {
  await chatStore.disconnect()
}

const getIcon = (type) => {
  switch (type) {
    case 'chat': return '💬'
    case 'gift': return '🎁'
    case 'member': return '👋'
    case 'system': return '📢'
    default: return '💬'
  }
}
</script>