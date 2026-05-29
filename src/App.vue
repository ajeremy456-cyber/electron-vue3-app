<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 text-white flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-700">
        <h1 class="text-xl font-bold">📺 TikTok Live</h1>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-4">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-6 py-3 mx-2 rounded-lg transition-colors"
          :class="isActive(item.path)
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span class="font-medium">{{ item.name }}</span>
        </RouterLink>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-700 text-xs text-gray-500">
        <div>Electron {{ versions.electron }}</div>
        <div>Node {{ versions.node }}</div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b flex items-center px-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-700">
          {{ currentPageName }}
        </h2>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/', name: 'Dashboard', icon: '📊' },
  { path: '/livechat', name: 'LiveChat', icon: '💬' },
  { path: '/settings', name: 'Settings', icon: '⚙️' }
]

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const currentPageName = computed(() => {
  const item = navItems.find(n => isActive(n.path))
  return item?.name || 'Unknown'
})

const versions = window.electronAPI?.versions || { electron: 'N/A', node: 'N/A' }
</script>