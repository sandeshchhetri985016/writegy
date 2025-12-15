import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { documentApi, grammarApi } from '../../lib/api'
import { useDebounce } from 'use-debounce'
import { Save, ArrowLeft, FileText, Zap, BookOpen, PenTool } from 'lucide-react'
import toast from 'react-hot-toast'

function TextEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [documentId, setDocumentId] = useState(null)

  const { user } = useAuth()
  const { documentId: routeDocumentId } = useParams()
  const navigate = useNavigate()

  // Debounce the content for grammar checking
  const [debouncedContent] = useDebounce(content, 2000) // 2 seconds delay

  // Load document if editing existing one
  useEffect(() => {
    if (routeDocumentId) {
      loadDocument(routeDocumentId)
    } else {
      setTitle(`Document ${new Date().toLocaleDateString()}`)
    }
  }, [routeDocumentId])

  // Grammar check when content changes (debounced)
  useEffect(() => {
    if (debouncedContent.length > 50) {
      checkGrammar(debouncedContent)
    }
  }, [debouncedContent])

  const loadDocument = async (id) => {
    setIsLoading(true)
    try {
      const response = await documentApi.getDocument(id)
      setDocumentId(id)
      setTitle(response.data.title)
      setContent(response.data.content || '')
    } catch (error) {
      toast.error('Failed to load document')
      navigate('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const checkGrammar = async (text) => {
    try {
      const response = await grammarApi.checkGrammar({ text })
      setSuggestions(response.data.suggestions || [])
    } catch (error) {
      console.error('Grammar check failed:', error)
      // Don't show error toast for grammar checks to avoid interrupting writing
    }
  }

  const saveDocument = async () => {
    if (!title.trim()) {
      toast.error('Please enter a document title')
      return
    }

    setIsSaving(true)
    try {
      if (documentId) {
        // Update existing document
        await documentApi.updateDocument(documentId, {
          title: title.trim(),
          content: content
        })
        toast.success('Document updated successfully')
      } else {
        // Create new document
        const response = await documentApi.uploadDocument(
          new File([], 'empty.txt'), // Empty file for new docs
          title.trim(),
          content
        )
        setDocumentId(response.data.id)
        toast.success('Document created successfully')
        navigate(`/editor/${response.data.id}`)
      }
    } catch (error) {
      toast.error('Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }

  const applySuggestion = (suggestion) => {
    // For this basic implementation, just highlight suggestions
    // In a full implementation, you'd apply the suggestion to the text
    toast.info(`Suggestion: ${suggestion}`)
  }

  const getWordCount = () => {
    return content.trim() ? content.trim().split(/\s+/).length : 0
  }

  const getCharacterCount = () => {
    return content.length
  }

  const getReadingTime = () => {
    const wordsPerMinute = 200 // Average reading speed
    const words = getWordCount()
    const minutes = Math.ceil(words / wordsPerMinute)
    return minutes
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Text Editor</h1>
                <p className="text-sm text-gray-600">
                  {user?.email} • {documentId ? 'Editing' : 'Creating'} document
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={saveDocument}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title..."
            className="w-full text-3xl font-bold text-gray-900 border-none outline-none bg-transparent focus:ring-0 p-0 placeholder-gray-400"
          />
        </div>

        {/* Stats Bar */}
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              {getWordCount()} words
            </div>
            <div>{getCharacterCount()} characters</div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              ~{getReadingTime()} min read
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            {suggestions.length > 0 && (
              <div className="flex items-center text-orange-600">
                <Zap className="h-4 w-4 mr-1" />
                {suggestions.length} suggestions
              </div>
            )}
            <div className="text-green-600 font-medium">
              Draft saved automatically
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-sm rounded-lg">
              <div className="p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your document here... The grammar checker will automatically analyze your text as you type."
                  className="w-full h-96 border-none outline-none resize-none text-lg leading-relaxed placeholder-gray-400 focus:ring-0 p-0"
                  style={{ minHeight: '400px' }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Grammar Suggestions */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <PenTool className="h-5 w-5 mr-2 text-blue-600" />
                Writing Suggestions
              </h3>

              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm">
                    {debouncedContent.length > 50
                      ? 'No suggestions found. Great writing!'
                      : 'Start writing to see grammar suggestions...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50"
                    >
                      <p className="text-sm text-gray-700">{suggestion}</p>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Apply suggestion
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Writing Tips */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Writing Tips</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Write first, edit later</li>
                <li>• Use active voice when possible</li>
                <li>• Keep sentences concise</li>
                <li>• Vary sentence length</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextEditor
