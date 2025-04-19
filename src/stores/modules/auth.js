import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userLoginAPI } from '@/api/userAPI'

export const useAuthStore = defineStore(
  'auth',
  () => {
    // 状态定义
    const isAuthenticated = ref(false)
    const user = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const token = ref(localStorage.getItem('token') || '')

    // getters (使用computed)
    const userIsAuthenticated = computed(() => isAuthenticated.value)
    const getUserInfo = computed(() => user.value)
    const getLoading = computed(() => loading.value)
    const getError = computed(() => error.value)
    const getToken = computed(() => token.value)

    // actions
    const setLoading = (status) => {
      loading.value = status
    }

    const setError = (err) => {
      error.value = err
    }

    const setUser = (userData) => {
      user.value = userData
      isAuthenticated.value = true
    }

    const logout = () => {
      user.value = null
      isAuthenticated.value = false
      error.value = null
      localStorage.removeItem('token')
      token.value = ''
    }

    const login = async (credentials) => {
      try {
        setLoading(true)
        setError(null)

        const response = await userLoginAPI(credentials)

        if (response.user) {
          setUser(response.user)
          token.value = response.token
          localStorage.setItem('token', response.token)
        }

        return response.user.username
      } catch (err) {
        setError(err.message)
        return false
      } finally {
        setLoading(false)
      }
    }

    return {
      // 状态
      isAuthenticated,
      user,
      loading,
      error,
      token,
      // getters
      userIsAuthenticated,
      getUserInfo,
      getLoading,
      getError,
      getToken,
      // actions
      setLoading,
      setError,
      setUser,
      logout,
      login,
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'auth-store',
          storage: localStorage,
          paths: ['isAuthenticated', 'user', 'token'],
        },
      ],
    },
  },
)
