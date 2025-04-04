import axios from 'axios'
import { useUserStore } from '@/stores'
const baseURL = 'http://localhost:8080'
import router from '@/router'
import { ElMessage } from 'element-plus'
const instance = axios.create({
  // TODO 1. 基础地址，超时时间
  baseURL,
  timeout: 10000,
  withCredentials: true, // 添加这一行
})
instance.interceptors.request.use(
  (config) => {
    // TODO 2. 携带token
    const userStore = useUserStore()

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
    if (res.data.code && res.data.code !== 200) {
      ElMessage.error(res.data.message || '网络错误，请稍后再试')
      return Promise.reject(res.data)
    }
    return res.data // 直接返回核心数据
  },
  (err) => {
    // TODO 5. 处理401错误: token失效
    if (err.response.status === 401) {
      const userStore = useUserStore()
      userStore.removeToken()
      ElMessage.error('登录已失效，请重新登录')
      router.push('/login')
      return Promise.reject(err)
    }

    // TODO 6. 处理其他错误
    ElMessage.error(err.data.message || '网络错误，请稍后再试')

    return Promise.reject(err)
  },
)
export default instance
export { instance }
