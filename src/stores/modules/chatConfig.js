import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORE_KEY = 'chat_config_store'

export const useChatConfigStore = defineStore(
  'chatConfig',
  () => {
    // --- State ---
    const searchK = ref(3) // 知识库检索片段数量
    const temperature = ref(0.8) // 模型温度

    // --- Actions ---
    const setSearchK = (value) => {
      searchK.value = value
    }

    const setTemperature = (value) => {
      temperature.value = value
    }

    return {
      // State
      searchK,
      temperature,
      // Actions
      setSearchK,
      setTemperature,
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: STORE_KEY,
          storage: localStorage,
          paths: ['searchK', 'temperature'],
        },
      ],
    },
  },
)
