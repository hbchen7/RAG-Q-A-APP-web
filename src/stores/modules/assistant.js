// filepath: src/stores/modules/assistant.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAssistantListAPI,
  createAssistantAPI,
  updateAssistantAPI,
  deleteAssistantAPI,
} from '@/api/assistentAPI.js'
import { useAuthStore } from './auth' // 引入 auth store

/**
 * @description 助手管理 Store
 */
export const useAssistantStore = defineStore(
  'assistant',
  () => {
    const authStore = useAuthStore() // 获取 auth store 实例

    // --- State ---
    /**
     * @type {import('vue').Ref<Array<object>>}
     * @description 助手列表
     */
    const assistantList = ref([])
    /**
     * @type {import('vue').Ref<object|null>}
     * @description 当前选中的助手对象
     */
    const currentAssistant = ref(null)
    /**
     * @type {import('vue').Ref<boolean>}
     * @description 加载状态
     */
    const loading = ref(false)
    /**
     * @type {import('vue').Ref<string|null>}
     * @description 错误信息
     */
    const error = ref(null)

    // --- Getters ---
    /**
     * @description 获取助手列表
     */
    const getAssistantList = computed(() => assistantList.value)
    /**
     * @description 获取当前选中的助手
     */
    const getCurrentAssistant = computed(() => {
      console.log('getCurrentAssistant getter 被调用，返回:', currentAssistant.value) // 添加日志
      return currentAssistant.value
    })
    /**
     * @description 获取加载状态
     */
    const isLoading = computed(() => loading.value)
    /**
     * @description 获取错误信息
     */
    const getError = computed(() => error.value)

    // --- Actions ---
    /**
     * @description 设置加载状态
     * @param {boolean} status - 加载状态
     */
    const setLoading = (status) => {
      loading.value = status
    }

    /**
     * @description 设置错误信息
     * @param {Error | string | null} err - 错误对象或错误信息
     */
    const setError = (err) => {
      error.value = err ? (err instanceof Error ? err.message : String(err)) : null
      if (error.value) {
        console.error('Assistant Store Error:', error.value) // 在控制台也打印错误
      }
    }

    /**
     * @description 获取当前用户的助手列表 (修改：移除了缓存逻辑，确保每次调用都请求)
     * @returns {Promise<void>}
     */
    const fetchAssistantList = async () => {
      if (!authStore.user) {
        setError('用户未登录，无法获取助手列表')
        assistantList.value = [] // 清空列表
        currentAssistant.value = null // 清空选中
        return
      }
      setLoading(true)
      setError(null)
      try {
        console.log('开始获取助手列表...')
        const response = await getAssistantListAPI({ username: authStore.user.username })
        console.log('获取到的助手列表:', response)

        assistantList.value = response || []

        // 如果列表不为空且当前没有选中的助手，则选中第一个
        if (assistantList.value.length > 0 && !currentAssistant.value) {
          console.log('选中第一个助手:', assistantList.value[0])
          currentAssistant.value = assistantList.value[0] // 直接设置，不通过 selectAssistant
        }

        console.log('更新后的 currentAssistant:', currentAssistant.value)
      } catch (err) {
        setError(err)
        ElMessage.error('获取助手列表失败')
        assistantList.value = [] // 出错时清空列表
        currentAssistant.value = null // 清空选中
      } finally {
        setLoading(false)
      }
    }

    /**
     * @description 创建一个新的助手 (修改：确保 fetch 后能选中新助手)
     * @param {object} assistantData - 创建助手所需的数据
     * @param {string} [assistantData.title='新助手'] - 助手名称
     * @param {string} assistantData.prompt - 助手提示词
     * @returns {Promise<object|null>} 返回创建成功的助手对象或 null
     */
    const createAssistant = async (assistantData) => {
      if (!authStore.user) {
        setError('用户未登录，无法创建助手')
        ElMessage.error('请先登录')
        return null
      }
      setLoading(true)
      setError(null)
      try {
        const dataToSend = {
          username: authStore.user.username,
          title: assistantData.title || '新助手',
          prompt: assistantData.prompt,
        }
        const newAssistant = await createAssistantAPI(dataToSend)
        ElMessage.success(`助手 "${newAssistant.title}" 创建成功`)

        // 创建成功后，重新获取列表 (fetchAssistantList 现在会强制刷新)
        await fetchAssistantList()

        // 从 *刷新后的列表* 中查找并选中新创建的助手
        const createdAssistantInList = assistantList.value.find(
          (a) => a.id === newAssistant.id,
        )
        if (createdAssistantInList) {
          selectAssistant(createdAssistantInList)
        } else {
          // 如果因为某些原因（如API延迟或错误）没找到，给出警告并尝试选第一个
          console.warn(
            'CreateAssistant: Newly created assistant not found immediately in refreshed list. Selecting first if available.',
          )
          if (assistantList.value.length > 0) {
            selectAssistant(assistantList.value[0])
          } else {
            selectAssistant(null) // 或者清空
          }
        }
        return newAssistant // 返回创建的助手信息
      } catch (err) {
        setError(err)
        ElMessage.error(error.value || '创建助手失败')
        return null
      } finally {
        setLoading(false)
      }
    }

    /**
     * @description 设置当前选中的助手
     * @param {object | null} assistant - 要设置为当前选中的助手对象，或 null 清除选择
     */
    const selectAssistant = (assistant) => {
      console.log('assistantStore.selectAssistant 被调用，参数:', assistant) // 添加日志

      // 移除条件判断，直接设置
      currentAssistant.value = assistant

      console.log('设置后的 currentAssistant:', currentAssistant.value) // 添加日志
    }

    /**
     * @description 更新助手信息
     * @param {string} assistantId - 要更新的助手 ID
     * @param {object} data - 更新的数据
     * @returns {Promise<void>}
     */
    const updateAssistant = async (assistantId, data) => {
      if (!authStore.user) {
        setError('用户未登录，无法更新助手')
        ElMessage.error('请先登录')
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await updateAssistantAPI(assistantId, data)
        ElMessage.success(`助手 "${response.title}" 更新成功`)

        // 更新本地列表中的助手数据
        const index = assistantList.value.findIndex((a) => a._id === assistantId)
        if (index !== -1) {
          assistantList.value[index] = { ...assistantList.value[index], ...response }
          // 如果更新的是当前选中的助手，也更新 currentAssistant
          if (currentAssistant.value && currentAssistant.value._id === assistantId) {
            currentAssistant.value = { ...currentAssistant.value, ...response }
          }
        }
      } catch (err) {
        setError(err)
        ElMessage.error(error.value || '更新助手失败')
      } finally {
        setLoading(false)
      }
    }

    /**
     * @description 删除助手
     * @param {string} assistantId - 要删除的助手 ID
     * @returns {Promise<void>}
     */
    const deleteAssistant = async (assistantId) => {
      if (!authStore.user) {
        setError('用户未登录，无法删除助手')
        ElMessage.error('请先登录')
        return
      }

      setLoading(true)
      setError(null)
      try {
        await deleteAssistantAPI(assistantId)
        ElMessage.success('助手删除成功')

        // 从列表中移除该助手
        assistantList.value = assistantList.value.filter((a) => a._id !== assistantId)

        // 如果删除的是当前选中的助手，清除选中状态并选择新的助手
        if (currentAssistant.value && currentAssistant.value._id === assistantId) {
          if (assistantList.value.length > 0) {
            selectAssistant(assistantList.value[0])
          } else {
            selectAssistant(null)
          }
        }
      } catch (err) {
        setError(err)
        ElMessage.error(error.value || '删除助手失败')
      } finally {
        setLoading(false)
      }
    }

    return {
      // State
      assistantList,
      currentAssistant,
      loading,
      error,
      // Getters
      getAssistantList,
      getCurrentAssistant,
      isLoading,
      getError,
      // Actions
      fetchAssistantList,
      createAssistant,
      selectAssistant,
      setLoading, // 可选暴露
      setError, // 可选暴露
      updateAssistant,
      deleteAssistant,
    }
  },
  {
    // --- Pinia Persist ---
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'assistant-store',
          storage: localStorage,
          paths: ['assistantList'], // 只保留 assistantList
          afterRestore: (ctx) => {
            // 添加恢复后的处理
            console.log('Store 状态恢复后:', ctx.store.$state)
          },
        },
      ],
    },
  },
)
