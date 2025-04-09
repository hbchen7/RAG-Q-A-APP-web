import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const topicStore = defineStore('topic_store', () => {
  const topicsList = ref([])
  const currentTopic = ref(null)

  return {
    topics,
    currentTopic,
  }
})
