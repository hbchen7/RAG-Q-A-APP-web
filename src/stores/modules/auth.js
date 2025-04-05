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

    // getters (使用computed)
    const userIsAuthenticated = computed(() => isAuthenticated.value)
    const getUserInfo = computed(() => user.value)
    const getLoading = computed(() => loading.value)
    const getError = computed(() => error.value)

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
    }

    const login = async (credentials) => {
      try {
        setLoading(true)
        setError(null)

        const response = await userLoginAPI(credentials)

        if (response.user) {
          setUser(response.user)
          localStorage.setItem('token', response.token)
        }

        return true
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

      // getters
      userIsAuthenticated,
      getUserInfo,
      getLoading,
      getError,

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
      key: 'auth',
      storage: localStorage,
      paths: ['isAuthenticated', 'user'],
    },
  },
)
