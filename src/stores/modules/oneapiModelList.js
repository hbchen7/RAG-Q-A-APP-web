import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getModelTokens_Oneapi, getSelf_Oneapi } from '@/api/oneapi'
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
    // 新增：存储原始配额数据
    const accountQuota = ref(0) // 用户总配额
    const accountUsedQuota = ref(0) // 用户已用配额

    const remain_quota = computed(() => accountQuota.value - accountUsedQuota.value)
    // 格式化后的剩余配额 (保持不变)
    const formattedAccountQuota = computed(() => formatQuota(remain_quota.value))

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
      // 处理可能的负数或非数字情况
      return isNaN(number) || number < 0 ? 'N/A' : number.toString()
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
      const tokenRemainingQuota = token.remain_quota - token.used_quota
      return formatQuota(tokenRemainingQuota)
    })

    // Actions
    // 更新令牌列表和用户配额
    const updateTokenList = async () => {
      loading.value = true
      error.value = null // 重置错误状态
      try {
        // 同时发起两个请求
        const [tokenResponse, selfResponse] = await Promise.all([
          getModelTokens_Oneapi(),
          getSelf_Oneapi(),
        ])

        // 处理令牌列表
        if (tokenResponse.success) {
          tokenList.value = tokenResponse.data
          // 检查并切换失效的选中令牌
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
        } else {
          // 如果令牌列表请求失败，也记录错误
          error.value = tokenResponse.message || '获取令牌列表失败'
          ElMessage.error(error.value)
        }

        // 修改：处理用户配额信息
        if (selfResponse.success && selfResponse.data) {
          accountQuota.value = selfResponse.data.quota ?? 0 // 使用 ?? 提供默认值
          accountUsedQuota.value = selfResponse.data.used_quota ?? 0
        } else {
          // 如果获取用户信息失败，也记录错误
          const selfError = selfResponse.message || '获取用户配额失败'
          // 避免重复提示相同的错误
          if (!error.value) {
            error.value = selfError
            ElMessage.error(error.value)
          } else {
            console.error('获取用户配额失败:', selfError)
          }
        }

        // 只有两个请求都成功才返回 true
        return tokenResponse.success && selfResponse.success
      } catch (err) {
        error.value = err.message || '刷新数据时发生未知错误'
        ElMessage.error(error.value)
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
          await updateTokenList() // 定时刷新也会更新配额
        },
        10 * 60 * 1000,
      ) // 10分钟刷新一次
    }

    // 初始化
    const init = async () => {
      // 初始化时就获取数据
      await updateTokenList()

      // 如果没有选中令牌且有有效令牌，默认选中第一个
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

    // 清除持久化数据并重置状态
    const clearPersistedData = () => {
      tokenList.value = []
      selectedToken.value = null
      selectedModel.value = null
      accountQuota.value = 0 // 重置总配额
      accountUsedQuota.value = 0 // 重置已用配额
      loading.value = false
      error.value = null
      cleanup()
      localStorage.removeItem(STORE_KEY)
    }

    return {
      // 状态
      tokenList,
      selectedToken,
      selectedModel,
      loading,
      error,
      accountQuota, // 导出总配额
      accountUsedQuota, // 导出已用配额
      // 计算属性
      remain_quota, // 导出计算后的剩余配额
      validTokens,
      availableModels,
      getTokenQuota, // 令牌自身额度
      formattedAccountQuota, // 格式化的账户剩余额度
      // 方法
      updateTokenList,
      selectToken,
      selectModel,
      init,
      cleanup,
      clearPersistedData,
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: STORE_KEY,
          storage: localStorage,
          // 只持久化这三个状态
          paths: ['tokenList', 'selectedToken', 'selectedModel'],
        },
      ],
    },
  },
)
