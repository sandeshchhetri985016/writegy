import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('supabase_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Download file from blob response
 * @param {Blob} blob - File blob data
 * @param {string} filename - Desired filename
 */
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Extract filename from Content-Disposition header
 * @param {string} contentDisposition - Content-Disposition header value
 * @param {string} defaultFilename - Default filename if extraction fails
 * @returns {string} Extracted filename
 */
const extractFilename = (contentDisposition, defaultFilename) => {
  if (!contentDisposition) return defaultFilename
  
  // Try to extract filename from Content-Disposition header
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1].replace(/['"]/g, '')
  }
  
  return defaultFilename
}

/**
 * Generate timestamp string for filename
 * @returns {string} Timestamp in format YYYYMMDD-HHmmss
 */
const generateTimestamp = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`
}

/**
 * Generate safe filename from document title
 * @param {string} title - Document title
 * @param {string} extension - File extension
 * @returns {string} Safe filename
 */
const generateSafeFilename = (title, extension) => {
  if (!title || title.trim() === '') {
    return `document-${generateTimestamp()}.${extension}`
  }
  
  // Remove invalid characters and replace with dashes
  const safeTitle = title
    .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid chars with dash
    .replace(/\s+/g, '-')           // Replace spaces with dash
    .replace(/-+/g, '-')            // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '')          // Remove leading/trailing dashes
    .trim()
  
  // Limit length
  const truncatedTitle = safeTitle.length > 50 ? safeTitle.substring(0, 50) : safeTitle
  const finalTitle = truncatedTitle || 'document'
  
  return `${finalTitle}-${generateTimestamp()}.${extension}`
}

/**
 * Export document to PDF format
 * @param {number} documentId - Document ID
 * @returns {Promise<boolean>} Success status
 */
export const exportToPdf = async (documentId) => {
  try {
    const response = await api.post(`/documents/${documentId}/export`, null, {
      params: { format: 'pdf' },
      responseType: 'blob',
      timeout: 30000, // 30 second timeout for PDF generation
    })
    
    // Extract filename from headers or generate one
    const contentDisposition = response.headers['content-disposition']
    const filename = extractFilename(contentDisposition, generateSafeFilename('', 'pdf'))
    
    downloadFile(response.data, filename)
    toast.success('PDF exported successfully!')
    return true
  } catch (error) {
    console.error('PDF export failed:', error)
    
    if (error.response?.status === 404) {
      toast.error('Document not found')
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to export this document")
    } else if (error.response?.status === 400) {
      toast.error('Invalid export format')
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Export timeout - document may be too large')
    } else {
      toast.error('Failed to export PDF. Please try again.')
    }
    
    return false
  }
}

/**
 * Export document to DOCX format
 * @param {number} documentId - Document ID
 * @returns {Promise<boolean>} Success status
 */
export const exportToDocx = async (documentId) => {
  try {
    const response = await api.post(`/documents/${documentId}/export`, null, {
      params: { format: 'docx' },
      responseType: 'blob',
      timeout: 30000, // 30 second timeout for DOCX generation
    })
    
    // Extract filename from headers or generate one
    const contentDisposition = response.headers['content-disposition']
    const filename = extractFilename(contentDisposition, generateSafeFilename('', 'docx'))
    
    downloadFile(response.data, filename)
    toast.success('DOCX exported successfully!')
    return true
  } catch (error) {
    console.error('DOCX export failed:', error)
    
    if (error.response?.status === 404) {
      toast.error('Document not found')
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to export this document")
    } else if (error.response?.status === 400) {
      toast.error('Invalid export format')
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Export timeout - document may be too large')
    } else {
      toast.error('Failed to export DOCX. Please try again.')
    }
    
    return false
  }
}

/**
 * Export document to Markdown format
 * @param {number} documentId - Document ID
 * @returns {Promise<boolean>} Success status
 */
export const exportToMarkdown = async (documentId) => {
  try {
    const response = await api.post(`/documents/${documentId}/export`, null, {
      params: { format: 'md' },
      responseType: 'blob',
      timeout: 15000, // 15 second timeout for Markdown generation
    })
    
    // Extract filename from headers or generate one
    const contentDisposition = response.headers['content-disposition']
    const filename = extractFilename(contentDisposition, generateSafeFilename('', 'md'))
    
    downloadFile(response.data, filename)
    toast.success('Markdown exported successfully!')
    return true
  } catch (error) {
    console.error('Markdown export failed:', error)
    
    if (error.response?.status === 404) {
      toast.error('Document not found')
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to export this document")
    } else if (error.response?.status === 400) {
      toast.error('Invalid export format')
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Export timeout - document may be too large')
    } else {
      toast.error('Failed to export Markdown. Please try again.')
    }
    
    return false
  }
}

/**
 * Export document to specified format
 * @param {number} documentId - Document ID
 * @param {string} format - Export format (pdf, docx, md)
 * @returns {Promise<boolean>} Success status
 */
export const exportDocument = async (documentId, format) => {
  switch (format.toLowerCase()) {
    case 'pdf':
      return await exportToPdf(documentId)
    case 'docx':
      return await exportToDocx(documentId)
    case 'md':
    case 'markdown':
      return await exportToMarkdown(documentId)
    default:
      toast.error('Invalid export format')
      return false
  }
}

/**
 * Get available export formats
 * @returns {Promise<Array>} Array of available formats
 */
export const getAvailableFormats = async () => {
  try {
    const response = await api.get('/documents/export/formats')
    return response.data.formats || []
  } catch (error) {
    console.error('Failed to get export formats:', error)
    // Return default formats if API call fails
    return [
      {
        id: 'pdf',
        name: 'PDF',
        description: 'Portable Document Format',
        extension: '.pdf',
        contentType: 'application/pdf'
      },
      {
        id: 'docx',
        name: 'Microsoft Word',
        description: 'Office Open XML Document',
        extension: '.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      {
        id: 'md',
        name: 'Markdown',
        description: 'Plain text with markdown formatting',
        extension: '.md',
        contentType: 'text/markdown; charset=UTF-8'
      }
    ]
  }
}

export default {
  exportToPdf,
  exportToDocx,
  exportToMarkdown,
  exportDocument,
  getAvailableFormats
}