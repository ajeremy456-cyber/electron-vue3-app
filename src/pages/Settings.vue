<template>
  <div class="max-w-2xl space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold mb-4">⚙️ 應用程式設定</h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">直播間預設用戶名</label>
          <input
            v-model="settings.defaultUsername"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入預設用戶名"
          />
        </div>

        <div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="settings.autoConnect"
              type="checkbox"
              class="w-5 h-5 rounded text-blue-600"
            />
            <span class="text-sm text-gray-700">啟動時自動連接上一個直播間</span>
          </label>
        </div>

        <div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="settings.notifications"
              type="checkbox"
              class="w-5 h-5 rounded text-blue-600"
            />
            <span class="text-sm text-gray-700">啟用桌面通知</span>
          </label>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">截圖儲存路徑</label>
          <input
            v-model="settings.savePath"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="選擇資料夾"
          />
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-gray-200 flex gap-3">
        <button
          @click="saveSettings"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          儲存設定
        </button>
        <button
          @click="resetSettings"
          class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          重置
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold mb-4">ℹ️ 關於</h3>
      <div class="space-y-2 text-sm text-gray-600">
        <div>版本：v1.0.0</div>
        <div>Electron + Vue3 + TailwindCSS</div>
        <div>作者：Jeremy</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const settings = ref({
  defaultUsername: '',
  autoConnect: false,
  notifications: true,
  savePath: ''
})

const saveSettings = () => {
  localStorage.setItem('app-settings', JSON.stringify(settings.value))
  alert('設定已儲存')
}

const resetSettings = () => {
  settings.value = {
    defaultUsername: '',
    autoConnect: false,
    notifications: true,
    savePath: ''
  }
}
</script>