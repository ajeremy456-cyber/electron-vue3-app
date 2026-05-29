<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex gap-3">
      <input
        v-model="roomId"
        type="text"
        placeholder="輸入直播間用戶名..."
        class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keyup.enter="connect"
      />
      <button
        @click="connect"
        :disabled="isConnected"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isConnected ? '已連接' : '連接' }}
      </button>
      <button
        v-if="isConnected"
        @click="disconnect"
        class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        中斷
      </button>
    </div>

    <!-- Chat Messages -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-2">
      <div v-if="messages.length === 0" class="text-center text-gray-400 mt-10">
        尚無留言，連接直播間後開始接收訊息
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex gap-3 py-2 hover:bg-gray-50 rounded px-2"
      >
        <span class="text-lg">{{ msg.type === 'chat' ? '💬' : msg.type === 'member' ? '👋' : '🎁' }}</span>
        <div>
          <span class="font-semibold text-blue-600">{{ msg.nickname }}</span>
          <span class="text-gray-500 text-sm ml-2">{{ msg.time }}</span>
          <div class="text-gray-800">{{ msg.text }}</div>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="p-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500 flex justify-between">
      <span>{{ isConnected ? '🟢 已連接到 @' + currentRoom : '⚪ 未連接' }}</span>
      <span>共 {{ messages.length }} 條訊息</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const roomId = ref('')
const isConnected = ref(false)
const currentRoom = ref('')
const messages = ref([])
const chatContainer = ref(null)

const connect = () => {
  if (!roomId.value.trim()) return
  currentRoom.value = roomId.value.trim()
  isConnected.value = true
  messages.value.push({
    type: 'system',
    nickname: '系統',
    text: `已連接到直播間 @${currentRoom.value}`,
    time: new Date().toLocaleTimeString()
  })
}

const disconnect = () => {
  isConnected.value = false
  messages.value.push({
    type: 'system',
    nickname: '系統',
    text: `已中斷連接`,
    time: new Date().toLocaleTimeString()
  })
}
</script>