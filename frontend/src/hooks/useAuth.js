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
    const u = { username: credentials.username }
    setAuthToken(t)
    setAuth(t, u)
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
