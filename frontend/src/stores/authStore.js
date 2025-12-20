import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isDevSession: false,
      setAuth: (token, user) => set({ token, user }),
      setDevSession: (val = true) => set({ isDevSession: val }),
      clearAuth: () => set({ token: null, user: null, isDevSession: false })
    }),
    {
      name: 'auth-storage'
    }
  )
)

export default useAuthStore
