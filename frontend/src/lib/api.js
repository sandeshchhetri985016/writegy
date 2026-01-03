import axios from 'axios'
import toast from 'react-hot-toast'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000
})

// Request interceptor to add Supabase JWT token
api.interceptors.request.use(
  (config) => {
    try {
      // Get the JWT token from localStorage (stored by AuthContext)
      const token = localStorage.getItem('supabase_token')
      
      console.log('API Request - Token from localStorage:', token)
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('API Request - Authorization header set')
      } else {
        console.log('API Request - No token found in localStorage')
      }
    } catch (error) {
      console.warn('Failed to get token from localStorage:', error)
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
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          toast.error('Authentication required')
          localStorage.removeItem('access_token')
          window.location.href = '/login'
          break
        case 403:
          toast.error('Access denied')
          break
        case 429:
          toast.error('Rate limit exceeded. Try again later.')
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          toast.error(data?.message || 'An error occurred')
          break
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    } else {
      toast.error('Request failed. Please try again.')
    }

    return Promise.reject(error)
  }
)

// Document API
export const documentApi = {
  // Get all documents
  getAllDocuments: () => api.get('/api/documents'),

  // Upload document (hybrid approach)
  uploadDocument: (file, title, content) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('content', content)

    return api.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Get single document
  getDocument: (id) => api.get(`/api/documents/${id}`),

  // Update document
  updateDocument: (id, data) => api.put(`/api/documents/${id}`, data),

  // Delete document
  deleteDocument: (id) => api.delete(`/api/documents/${id}`),

  // Set document parent (for tree hierarchy)
  setDocumentParent: (id, parentId) => api.post(`/api/documents/${id}/parent`, null, {
    params: { parentId }
  })
}

// Auth API
export const authApi = {
  // Sync user with backend (called after Supabase auth)
  syncUser: () => api.post('/auth/sync'),

  // Get current user info
  getCurrentUser: () => api.get('/auth/me')
}

// Grammar API
export const grammarApi = {
  // Check grammar
  checkGrammar: (text) => api.post('/api/grammar/check', { text })
}

export default api
