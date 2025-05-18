import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORE_KEY = 'chat_config_store'

export const useChatConfigStore = defineStore(
  'chatConfig',
  () => {
    // --- State ---
    const searchK = ref(10) // 知识库检索片段数量
    const temperature = ref(1) // 模型温度
    const bm25K = ref(3) // BM25 检索条目，默认为3
    const rerankTopN = ref(5) // Reranker 重排序条目，默认为5

    // --- Actions ---
    const setSearchK = (value) => {
      searchK.value = value
    }

    const setTemperature = (value) => {
      temperature.value = value
    }

    const setBm25K = (value) => {
      bm25K.value = value
    }

    const setRerankTopN = (value) => {
      rerankTopN.value = value
    }

    return {
      // State
      searchK,
      temperature,
      bm25K,
      rerankTopN,
      // Actions
      setSearchK,
      setTemperature,
      setBm25K,
      setRerankTopN,
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: STORE_KEY,
          storage: localStorage,
          paths: ['searchK', 'temperature', 'bm25K', 'rerankTopN'],
        },
      ],
    },
  },
)
