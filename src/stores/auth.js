import { userLoginAPI } from '@/api/userAPI'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    // 获取用户登录状态
    userIsAuthenticated: (state) => state.isAuthenticated,
    // 获取用户信息
    getUserInfo: (state) => state.user,
    // 获取加载状态
    getLoading: (state) => state.loading,
    // 获取错误信息
    getError: (state) => state.error,
  },

  actions: {
    // 设置加载状态
    setLoading(status) {
      this.loading = status
    },

    // 设置错误信息
    setError(error) {
      this.error = error
    },

    // 设置用户信息
    setUser(user) {
      this.user = user
      this.isAuthenticated = true
    },

    // 退出登录
    logout() {
      this.user = null
      this.isAuthenticated = false
      this.error = null
    },

    // 登录动作
    async login(credentials) {
      try {
        this.setLoading(true)
        this.setError(null)

        // TODO: 调用登录API
        const response = await userLoginAPI(credentials)

        if (response.user) {
          this.user = response.user
          this.isAuthenticated = true

          // 存储token
          localStorage.setItem('token', response.token)
        }

        return true
      } catch (error) {
        this.setError(error.message)
        return false
      } finally {
        this.setLoading(false)
      }
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth',
        storage: localStorage,
        paths: ['isAuthenticated', 'user'],
      },
    ],
  },
})
