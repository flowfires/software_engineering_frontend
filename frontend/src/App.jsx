import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Lessons from './pages/Lessons'
import CourseDetail from './pages/CourseDetail'
import Courses from './pages/Courses'
import LessonEditor from './pages/LessonEditor'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import api, { setAuthToken } from './services/api'
import useAuthStore from './stores/authStore'

export default function App() {
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  // Verify token on app load: if invalid, clear auth and redirect to login
  useEffect(() => {
    let mounted = true
    async function verify() {
      if (!token) return

      // Skip verification for developer session tokens (explicitly set via dev backdoor)
      if (import.meta.env.DEV && useAuthStore.getState().isDevSession) {
        return
      }

      try {
        const resp = await api.get('/teacher/profile')
        // set user if provided
        if (mounted && resp?.data) {
          useAuthStore.getState().setAuth(token, resp.data)
        }
      } catch (err) {
        // If unauthorized, clear stored token and redirect to login
        if (err.isUnauthorized || err?.response?.status === 401) {
          useAuthStore.getState().clearAuth()
          setAuthToken(null)
          // use window.location to ensure redirect works from this top-level
          window.location.href = '/login'
        }
      }
    }
    verify()
    return () => {
      mounted = false
    }
  }, [token])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="lessons/:id" element={<LessonEditor />} />
          <Route path="lessons/new" element={<LessonEditor />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
