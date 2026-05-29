import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import tiktokService from '@/services/tiktok'

export const useChatStore = defineStore('chat', () => {
  // State
  const isConnected = ref(false)
  const currentRoom = ref('')
  const messages = ref([])
  const error = ref(null)

  // Max messages to keep in memory
  const MAX_MESSAGES = 500

  // Getters
  const messageCount = computed(() => messages.value.length)
  const recentMessages = computed(() =>
    messages.value.slice(-100) // last 100 messages
  )

  // Actions
  const addMessage = (msg) => {
    const entry = {
      id: Date.now() + Math.random(),
      type: msg.type,
      nickname: msg.nickname,
      text: msg.text,
      time: msg.time || new Date().toLocaleTimeString()
    }
    messages.value.push(entry)

    // Keep only last MAX_MESSAGES
    if (messages.value.length > MAX_MESSAGES) {
      messages.value = messages.value.slice(-MAX_MESSAGES)
    }

    return entry
  }

  const clearMessages = () => {
    messages.value = []
  }

  const setConnected = (value, room = '') => {
    isConnected.value = value
    if (value) {
      currentRoom.value = room
      error.value = null
    } else {
      currentRoom.value = ''
    }
  }

  const setError = (err) => {
    error.value = err
  }

  const connect = async (uniqueId) => {
    // Set up event listeners
    tiktokService.onChat((msg) => addMessage(msg))
    tiktokService.onGift((msg) => addMessage(msg))
    tiktokService.onMember((msg) => addMessage(msg))

    tiktokService.onStreamEnd(() => {
      setConnected(false)
      addMessage({
        type: 'system',
        nickname: '系統',
        text: '直播已結束',
        time: new Date().toLocaleTimeString()
      })
    })

    tiktokService.onDisconnect(() => {
      setConnected(false)
      addMessage({
        type: 'system',
        nickname: '系統',
        text: '連線已中斷',
        time: new Date().toLocaleTimeString()
      })
    })

    // Add system message
    addMessage({
      type: 'system',
      nickname: '系統',
      text: `正在連接到 @${uniqueId}...`,
      time: new Date().toLocaleTimeString()
    })

    const result = await tiktokService.connect(uniqueId)

    if (result.success) {
      setConnected(true, uniqueId)
      addMessage({
        type: 'system',
        nickname: '系統',
        text: `已連接到直播間 @${uniqueId}`,
        time: new Date().toLocaleTimeString()
      })
    } else {
      addMessage({
        type: 'system',
        nickname: '系統',
        text: `連接失敗: ${result.error}`,
        time: new Date().toLocaleTimeString()
      })
      setError(result.error)
    }

    return result
  }

  const disconnect = async () => {
    addMessage({
      type: 'system',
      nickname: '系統',
      text: '正在中斷連線...',
      time: new Date().toLocaleTimeString()
    })

    tiktokService.removeAllListeners()
    await tiktokService.disconnect()
    setConnected(false)
  }

  return {
    // State
    isConnected,
    currentRoom,
    messages,
    error,
    // Getters
    messageCount,
    recentMessages,
    // Actions
    addMessage,
    clearMessages,
    setConnected,
    setError,
    connect,
    disconnect
  }
})