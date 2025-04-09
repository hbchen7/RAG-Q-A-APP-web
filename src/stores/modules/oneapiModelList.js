import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getModelTokens_Oneapi } from '@/api/oneapi'
import { ElMessage } from 'element-plus'

const STORE_KEY = 'oneapi_token_config' // 定义本地存储的 Key

export const oneapiModelListStore = defineStore(
  'oneapi_token_store',
  () => {
    // 状态定义
    const tokenList = ref([]) // 完整的令牌列表数据
    const selectedToken = ref(null) // 当前选中的令牌
    const selectedModel = ref(null) // 当前选中的模型
    const loading = ref(false) // 加载状态
    const error = ref(null) // 错误信息

    // 工具函数：格式化配额数字显示
    const formatQuota = (number) => {
      if (number >= 10000000) {
        return `${Math.floor(number / 10000000)}千W`
      }
      if (number >= 10000) {
        return `${Math.floor(number / 10000)}W`
      }
      if (number >= 1000) {
        return `${Math.floor(number / 1000)}K`
      }
      return number.toString()
    }

    // Getters
    // 获取有效的令牌列表
    const validTokens = computed(() =>
      tokenList.value.filter((token) => token.status === 1),
    )

    // 获取当前选中令牌的可用模型列表
    const availableModels = computed(() => {
      if (!selectedToken.value) return []
      return selectedToken.value.models.split(',')
    })

    // 获取令牌的配额信息
    const getTokenQuota = computed(() => (token) => {
      if (token.unlimited_quota) return '不限额'
      const remainingQuota = token.remain_quota - token.used_quota
      return formatQuota(remainingQuota)
    })

    // Actions
    // 更新令牌列表
    const updateTokenList = async () => {
      loading.value = true
      try {
        const response = await getModelTokens_Oneapi()
        if (response.success) {
          tokenList.value = response.data

          // 如果当前选中的令牌失效，切换到第一个有效令牌
          if (selectedToken.value) {
            const currentToken = tokenList.value.find(
              (t) => t.id === selectedToken.value.id,
            )
            if (!currentToken || currentToken.status === 0) {
              const firstValidToken = validTokens.value[0]
              if (firstValidToken) {
                selectToken(firstValidToken)
              } else {
                selectedToken.value = null
                selectedModel.value = null
              }
            }
          }
        }
        return true
      } catch (err) {
        error.value = err.message
        ElMessage.error('刷新令牌列表失败')
        return false
      } finally {
        loading.value = false
      }
    }

    // 选择令牌
    const selectToken = (token) => {
      if (token.status === 0) return
      selectedToken.value = token
      // 如果当前选中的模型不在新令牌的模型列表中，清空选中的模型
      if (selectedModel.value && !token.models.includes(selectedModel.value)) {
        selectedModel.value = null
      }
    }

    // 选择模型
    const selectModel = (modelId) => {
      if (!selectedToken.value || !selectedToken.value.models.includes(modelId)) return
      selectedModel.value = modelId
    }

    // 自动刷新相关
    let refreshInterval
    const startAutoRefresh = () => {
      if (refreshInterval) clearInterval(refreshInterval)
      refreshInterval = setInterval(
        async () => {
          await updateTokenList()
        },
        10 * 60 * 1000,
      ) // 10分钟刷新一次
    }

    // 初始化
    const init = async () => {
      // 如果本地没有数据，从服务器获取
      if (!tokenList.value.length) {
        await updateTokenList()
      }

      // 如果有选中的令牌但已失效，切换到第一个有效令牌
      if (!selectedToken.value && validTokens.value.length > 0) {
        selectToken(validTokens.value[0])
      }

      // 启动自动刷新
      startAutoRefresh()
    }

    // 清理函数
    const cleanup = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }

    // 新增：清除持久化数据并重置状态
    const clearPersistedData = () => {
      tokenList.value = []
      selectedToken.value = null
      selectedModel.value = null
      loading.value = false
      error.value = null
      // 停止自动刷新
      cleanup()
      // 明确清除 localStorage 中的数据
      localStorage.removeItem(STORE_KEY)
    }

    return {
      // 状态
      tokenList,
      selectedToken,
      selectedModel,
      loading,
      error,
      // 计算属性
      validTokens,
      availableModels,
      getTokenQuota,
      // 方法
      updateTokenList,
      selectToken,
      selectModel,
      init,
      cleanup,
      clearPersistedData, // 导出新函数
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: STORE_KEY, // 使用定义的 Key
          storage: localStorage,
          paths: ['tokenList', 'selectedToken', 'selectedModel'],
        },
      ],
    },
  },
)
