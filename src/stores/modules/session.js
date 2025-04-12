import { defineStore } from 'pinia'
import { ref } from 'vue'

export const sessionStore = defineStore('session_store', () => {
  const sessionsList = ref([])
  const currentSession = ref(null)

  return {
    sessionsList,
    currentSession,
  }
})
