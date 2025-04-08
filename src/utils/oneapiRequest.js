import axios from 'axios'
import { ElMessage } from 'element-plus'
// 创建oneapi专用的axios实例
const oneapiInstance = axios.create({
  // baseURL: 'http://localhost:3001',
  baseURL: '/oneapi',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 跨域请求时携带cookie
})

// oneapi令牌需要在请求头中添加Authorization字段
oneapiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('oneapi_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
oneapiInstance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (!error.response) {
      ElMessage.error('网络连接异常，请检查网络')

      return Promise.reject(error)
    }

    // 处理错误响应
    ElMessage.error(error.response.data?.message || '请求失败，请稍后重试')
    return Promise.reject(error)
  },
)

export default oneapiInstance
