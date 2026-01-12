import axios from 'axios'
import useAuthStore from '../stores/authStore' // 【关键】引入你的状态管理

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000
})


api.interceptors.request.use(
  (config) => {
    // 每次发送请求前，从 Zustand Store (本地存储) 中获取 Token
    // 注意：在组件外使用 Zustand 需要用 .getState()
    const token = useAuthStore.getState().token
    
    // 如果有 Token，就自动加到请求头里
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log('[API] 请求头中已添加 Authorization 令牌')
    } else {
      console.warn('[API] 警告：未找到认证令牌，请求可能被后端拒绝')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// =========================================================
// 2. 响应拦截器 (Response Interceptor)
// =========================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果后端返回 401 (未授权)，说明 Token 过期或无效
    if (error.response && error.response.status === 401) {
      // 自动清除本地的登录状态
      useAuthStore.getState().clearAuth()
      
      // 可选：强制跳转回登录页 (根据你的需求决定是否开启)
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)


export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export default api