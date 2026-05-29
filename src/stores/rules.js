import { defineStore } from 'pinia'
import { ref } from 'vue'
import databaseService from '@/services/database'

export const useRulesStore = defineStore('rules', () => {
  const rules = ref([])
  const loading = ref(false)

  const fetchRules = async () => {
    loading.value = true
    try {
      rules.value = await databaseService.getKeywordRules()
    } finally {
      loading.value = false
    }
  }

  const addRule = async (keyword, autoReply = '', action = 'order') => {
    const result = await databaseService.addKeywordRule(keyword, autoReply, action)
    if (result) await fetchRules()
    return result
  }

  const updateRule = async (id, updates) => {
    const result = await databaseService.updateKeywordRule(id, updates)
    if (result) await fetchRules()
    return result
  }

  const deleteRule = async (id) => {
    const result = await databaseService.deleteKeywordRule(id)
    if (result) await fetchRules()
    return result
  }

  const toggleRule = async (id, enabled) => {
    return await updateRule(id, { enabled })
  }

  return {
    rules,
    loading,
    fetchRules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule
  }
})