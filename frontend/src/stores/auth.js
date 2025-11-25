import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.name || '')
  const userEmail = computed(() => user.value?.email || '')

  // Actions
  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const setUser = (userData) => {
    user.value = userData
  }

  const login = async (email, password) => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email,
        password
      })

      const { token: authToken, user: userData } = response.data.data

      setToken(authToken)
      setUser(userData)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${API_BASE}/register`, userData)

      const { token: authToken, user: newUser } = response.data.data

      setToken(authToken)
      setUser(newUser)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null

    try {
      if (token.value) {
        await axios.post(`${API_BASE}/logout`)
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setToken(null)
      setUser(null)
      loading.value = false
    }
  }

  const fetchUser = async () => {
    if (!token.value) return

    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${API_BASE}/user`)
      setUser(response.data.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch user'
      // If token is invalid, clear auth state
      if (err.response?.status === 401) {
        setToken(null)
        setUser(null)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshToken = async () => {
    if (!token.value) return

    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${API_BASE}/refresh`)
      const { token: newToken } = response.data.data
      
      setToken(newToken)
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Token refresh failed'
      // If refresh fails, clear auth state
      setToken(null)
      setUser(null)
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    if (token.value) {
      try {
        await fetchUser()
        return true
      } catch (err) {
        return false
      }
    }
    return false
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize auth on store creation
  const initialize = async () => {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      try {
        await fetchUser()
      } catch (err) {
        console.error('Failed to initialize auth:', err)
      }
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Computed
    isAuthenticated,
    userName,
    userEmail,
    // Actions
    login,
    register,
    logout,
    fetchUser,
    refreshToken,
    checkAuth,
    setToken,
    setUser,
    clearError,
    initialize
  }
})
