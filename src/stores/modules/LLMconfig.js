import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const userLLMconfig = defineStore('userLLMconfig', () => {
  const llmConfig = ref({
    supplier,
    model,
    apikey,
  })
})
