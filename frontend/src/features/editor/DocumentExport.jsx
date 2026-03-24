import { useState, useRef, useEffect } from 'react'
import { Download, FileText, File, ChevronDown, Loader2 } from 'lucide-react'
import { exportToPdf, exportToDocx, exportToMarkdown } from '../../lib/api/exportAPI'

const DocumentExport = ({ documentId, documentTitle, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingFormat, setLoadingFormat] = useState(null)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = async (format) => {
    if (!documentId || loading) return

    setLoading(true)
    setLoadingFormat(format)
    setIsOpen(false)

    try {
      let success = false
      
      switch (format) {
        case 'pdf':
          success = await exportToPdf(documentId)
          break
        case 'docx':
          success = await exportToDocx(documentId)
          break
        case 'md':
          success = await exportToMarkdown(documentId)
          break
        default:
          console.error('Invalid export format:', format)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
      setLoadingFormat(null)
    }
  }

  const exportOptions = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Portable Document Format',
      icon: FileText,
      color: 'text-red-600'
    },
    {
      id: 'docx',
      name: 'Microsoft Word',
      description: 'Office Open XML Document',
      icon: File,
      color: 'text-blue-600'
    },
    {
      id: 'md',
      name: 'Markdown',
      description: 'Plain text with markdown formatting',
      icon: FileText,
      color: 'text-gray-600'
    }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Export Button */}
      <button
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          disabled || loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        }`}
        aria-label="Export document"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Exporting {loadingFormat?.toUpperCase()}...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            <span>Export</span>
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {exportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleExport(option.id)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <div className="flex items-center">
                  <option.icon className={`w-5 h-5 mr-3 ${option.color}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Files will be named: {documentTitle ? `${documentTitle.substring(0, 30)}...` : 'document'}-timestamp.ext
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentExport