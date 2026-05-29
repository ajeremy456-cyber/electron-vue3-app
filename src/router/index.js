import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import LiveChat from '@/pages/LiveChat.vue'
import Settings from '@/pages/Settings.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/livechat', name: 'LiveChat', component: LiveChat },
  { path: '/settings', name: 'Settings', component: Settings }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router