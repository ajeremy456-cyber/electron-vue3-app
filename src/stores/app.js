import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const count = ref(0)
  const username = ref('')

  const increment = () => { count.value++ }
  const setUsername = (name) => { username.value = name }

  return { count, username, increment, setUsername }
})