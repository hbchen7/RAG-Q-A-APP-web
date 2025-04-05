import axios from 'axios'
import { useAuthStore } from '@/stores'
const baseURL = 'http://localhost:8080'
import router from '@/router'
import { ElMessage } from 'element-plus'
const instance = axios.create({
  // TODO 1. 基础地址，超时时间
  baseURL,
  timeout: 100000,
  withCredentials: true, // 添加这一行
})
instance.interceptors.request.use(
  (config) => {
    // TODO 2. 携带token
    const userStore = useAuthStore()

    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (err) => Promise.reject(err),
)
// 响应拦截器
instance.interceptors.response.use(
  (res) => {
    // TODO 3. 处理业务失败
    console.log('res', res)

    if (res.status && res.status !== 200) {
      ElMessage.error(res.message || '网络错误，请稍后再试')
      return Promise.reject(res)
    }
    return res.data // 直接返回核心数据
  },
  (err) => {
    if (!err.response) {
      ElMessage.error('网络连接异常，请检查网络')
      return Promise.reject(err)
    }

    // 处理401错误
    if (err.response.status === 401) {
      // 避免重复处理登录请求的401错误
      if (!err.config.url.includes('/user/login')) {
        const userStore = useAuthStore()
        userStore.logout()
        ElMessage.error('登录已失效，请重新登录')
        router.push('/login')
      }
      return Promise.reject(err)
    }

    // TODO 6. 处理其他错误
    ElMessage.error(err.response.data.detail || '网络错误，请稍后再试')
    console.error(`请求失败: ${err.response.status} - ${err.response.data.detail}`)
    return Promise.reject(err)
  },
)
export default instance
export { instance }
