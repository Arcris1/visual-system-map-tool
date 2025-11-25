import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear auth and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Diagram API methods
export const diagramApi = {
  // Get all diagrams
  async list(params = {}) {
    const response = await api.get('/diagrams', { params })
    return response.data
  },

  // Get single diagram
  async get(id) {
    const response = await api.get(`/diagrams/${id}`)
    return response.data
  },

  // Create new diagram
  async create(data) {
    const response = await api.post('/diagrams', data)
    return response.data
  },

  // Update diagram
  async update(id, data) {
    const response = await api.put(`/diagrams/${id}`, data)
    return response.data
  },

  // Delete diagram
  async delete(id) {
    const response = await api.delete(`/diagrams/${id}`)
    return response.data
  },

  // Duplicate diagram
  async duplicate(id) {
    const response = await api.post(`/diagrams/${id}/duplicate`)
    return response.data
  }
}

export default api