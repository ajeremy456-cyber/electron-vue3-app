<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="text-3xl mb-2">📺</div>
        <div class="text-2xl font-bold text-gray-800">{{ stats.liveViews }}</div>
        <div class="text-gray-500 text-sm">直播觀看數</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="text-3xl mb-2">💬</div>
        <div class="text-2xl font-bold text-gray-800">{{ stats.comments }}</div>
        <div class="text-gray-500 text-sm">總留言數</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="text-3xl mb-2">🎁</div>
        <div class="text-2xl font-bold text-gray-800">{{ stats.gifts }}</div>
        <div class="text-gray-500 text-sm">收到禮物</div>
      </div>
    </div>

    <div class="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 class="text-lg font-semibold mb-4">系統狀態</h3>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'

const stats = ref({
  liveViews: 0,
  comments: 0,
  gifts: 0
})

const versions = window.electronAPI?.versions || {}
const platform = window.electronAPI?.platform || 'unknown'
</script>