import { useCallback } from 'react'
import api, { setAuthToken } from '../services/api'
import useAuthStore from '../stores/authStore'

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore()

  const login = useCallback(async (credentials) => {
    // Backend expects OAuth2 form-encoded data (username, password)
    const params = new URLSearchParams()
    params.append('username', credentials.username)
    params.append('password', credentials.password)

    const resp = await api.post('/auth/login', params)
    const { access_token: t } = resp.data
    setAuthToken(t)
    // try fetch full profile from backend; if it fails, fall back to provided username
    try {
      const profileResp = await api.get('/auth/profile')
      const u = profileResp.data || { username: credentials.username }
      setAuth(t, u)
    } catch (e) {
      // if profile fetch fails, still set the auth with submitted username
      setAuth(t, { username: credentials.username })
    }
    return resp
  }, [setAuth])

  const logout = useCallback(() => {
    setAuthToken(null)
    clearAuth()
  }, [clearAuth])

  const register = useCallback(async (userData) => {
    // userData: { username, email, password, full_name }
    const resp = await api.post('/auth/register', userData)
    return resp
  }, [])

  return { token, user, login, logout, register }
}

export default useAuth
