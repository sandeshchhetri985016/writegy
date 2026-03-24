import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { documentApi, grammarApi } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import {
  Save,
  ArrowLeft,
  FileText,
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  SpellCheck,
  X,
  ChevronRight,
  ChevronLeft,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import mammoth from 'mammoth'
import * as pdfParse from 'pdf-parse'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import SuggestionPanel from './SuggestionPanel'
import MarkdownEditor from './MarkdownEditor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DocumentExport from './DocumentExport'

const TextEditor = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  // Check if draft should be restored (only when explicitly requested)
  const shouldRestoreDraft = searchParams.get('draft') === 'true'

  const [document, setDocument] = useState({
    title: '',
    content: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [editorMode, setEditorMode] = useState('rich-text') // 'rich-text' or 'markdown'
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const [lastSavedContent, setLastSavedContent] = useState('')
  const [grammarSuggestions, setGrammarSuggestions] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [fullCorrectionApplied, setFullCorrectionApplied] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set())
  const [highlightedText, setHighlightedText] = useState('')
  const [screenReaderStatus, setScreenReaderStatus] = useState('')
  const quillRef = useRef(null)

  useEffect(() => {
    if (id) {
      loadDocument()
    }
  }, [id])

  useEffect(() => {
    // Calculate word and character count
    // Strip HTML tags for accurate word count
    const text = document.content.replace(/<[^>]*>/g, ' ')
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length

    setWordCount(words)
    setCharCount(chars)
  }, [document.content])

  // Auto-save functionality and draft restoration
  useEffect(() => {
    // Restore draft from localStorage when explicitly requested via URL parameter
    if (!id && shouldRestoreDraft) { // Only restore when ?draft=true
      const draftKey = `writegy_draft_${user?.id || 'anonymous'}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          if (draft.title || draft.content) {
            setDocument({
              title: draft.title || '',
              content: draft.content || ''
            })
            
            // ✅ FIX: Restore document ID if it exists to prevent duplicate creation
            if (draft.documentId) {
              // Navigate to the correct document URL with draft=true parameter
              navigate(`/editor/${draft.documentId}?draft=true`, { replace: true })
            } else {
              toast.success('Draft restored from previous session')
            }
          }
        } catch (error) {
          console.warn('Failed to restore draft:', error)
        }
      }
    }
  }, [user, id, shouldRestoreDraft, navigate])

  // Debounced auto-save (saves 2 seconds after user stops typing)
  useEffect(() => {
    if (!document.title.trim() && !document.content.trim()) {
      return // Don't save empty drafts
    }

    if (document.content === lastSavedContent) {
      return // Don't save if content hasn't changed
    }

    // Show "Saving..." status immediately
    setAutoSaveStatus('Saving...')

    // Debounced save - wait 2 seconds after last change
    const saveTimeout = setTimeout(() => {
      autoSaveDraft()
    }, 2000)

    return () => clearTimeout(saveTimeout)
  }, [document.content, document.title, lastSavedContent, user])

  // Auto-save draft to localStorage
  const autoSaveDraft = () => {
    if (!document.title.trim() && !document.content.trim()) {
      return // Don't save empty drafts
    }

    if (document.content === lastSavedContent) {
      return // Don't save if content hasn't changed
    }

    try {
      const draftKey = `writegy_draft_${user?.id || 'anonymous'}`
      const draft = {
        documentId: id,  // ✅ FIX: Store the document ID to prevent duplicate creation
        title: document.title,
        content: document.content,
        timestamp: new Date().toISOString()
      }

      localStorage.setItem(draftKey, JSON.stringify(draft))
      setLastSavedContent(document.content)
      setAutoSaveStatus('Draft saved')

      // Clear status after 3 seconds
      setTimeout(() => setAutoSaveStatus(''), 3000)
    } catch (error) {
      console.warn('Failed to auto-save draft:', error)
    }
  }

  // Clear draft when document is saved to server
  const clearDraft = () => {
    const draftKey = `writegy_draft_${user?.id || 'anonymous'}`
    localStorage.removeItem(draftKey)
    setLastSavedContent(document.content)
    setAutoSaveStatus('Saved to server')
    setTimeout(() => setAutoSaveStatus(''), 3000)
  }

  const loadDocument = async () => {
    try {
      setLoading(true)
      const response = await documentApi.getDocument(id)
      setDocument({
        title: response.data.title,
        content: response.data.content
      })
    } catch (error) {
      console.error('Failed to load document:', error)
      toast.error('Failed to load document')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!document.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    try {
      setSaving(true)

      if (id) {
        // Update existing document
        await documentApi.updateDocument(id, {
          title: document.title,
          content: document.content
        })
        toast.success('Document saved successfully')
        clearDraft()
      } else {
        // Create new document with file upload
        const response = await documentApi.uploadDocument(
          null, // No file for now
          document.title,
          document.content
        )
        toast.success('Document created successfully')
        clearDraft()
        navigate(`/editor/${response.data.id}`)
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      toast.error('Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  const extractTextFromFile = async (file) => {
    const fileType = file.type

    if (fileType === 'application/pdf') {
      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const data = await pdfParse(uint8Array)
      return data.text
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract text from DOCX
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } else if (fileType === 'application/msword') {
      // DOC files are harder to parse in browser, show message
      throw new Error('DOC files are not supported for text extraction. Please convert to DOCX or PDF.')
    } else {
      throw new Error('Unsupported file type')
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PDF, DOC, or DOCX file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setLoading(true)
      toast('Extracting text from file...')

      // Extract text from the file
      const extractedText = await extractTextFromFile(file)

      // Set document with extracted text
      setDocument({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        content: extractedText || `Document uploaded: ${file.name}\n\nNo text could be extracted from this file.`
      })

      toast.success('File uploaded and text extracted successfully!')
    } catch (error) {
      console.error('Failed to upload file:', error)
      toast.error(error.message || 'Failed to upload file')
    } finally {
      setLoading(false)
    }
  }

  const handleGrammarCheck = async () => {
    // Strip HTML tags before sending to grammar checker
    const plainText = document.content.replace(/<[^>]*>/g, ' ')
    if (!plainText.trim()) {
      toast.error('Please write some content first')
      return
    }

    try {
      // Clear previous suggestions and show loading
      setGrammarSuggestions('Checking grammar...')
      setShowSuggestions(true)
      setFullCorrectionApplied(false)
      setAppliedSuggestions(new Set())

      const response = await grammarApi.checkGrammar(plainText)

      // The backend returns a string response with AI analysis
      if (response.data) {
        // Set the full AI analysis in the suggestions panel
        setGrammarSuggestions(response.data)
        toast.success('Grammar analysis complete!')

        // Log full analysis to console for detailed review
        console.log('Full Grammar Analysis:', response.data)
      } else {
        setGrammarSuggestions('Grammar check complete! No issues found.')
        toast.success('Grammar check complete! No issues found.')
      }
    } catch (error) {
      console.error('Grammar check failed:', error)
      setGrammarSuggestions('Grammar check failed. Please try again.')
      toast.error('Grammar check failed. Please try again.')
    }
  }

  const handleAddChild = () => {
    setShowAddChildModal(true)
  }

  const handleCreateChild = async (title, content) => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      // Use uploadDocument with null file for text-only documents
      await documentApi.uploadDocument(null, title, content)

      // Set parent relationship
      const response = await documentApi.getAllDocuments()
      const newDoc = response.data.find(doc => doc.title === title)

      if (newDoc) {
        await documentApi.setDocumentParent(newDoc.id, id)
        toast.success('Child document created successfully!')
        setShowAddChildModal(false)
      }
    } catch (error) {
      console.error('Failed to create child document:', error)
      toast.error('Failed to create child document')
    }
  }

  const handleApplySuggestion = (original, replacement) => {
    // Replace the specific text in the content
    // Note: This is a simple string replacement. For more complex rich text,
    // we would use Quill's selection API, but this works for the current state structure.
    if (!document.content.includes(original)) {
      toast.error('Could not find the original text to replace')
      return
    }
    const newContent = document.content.replace(original, replacement)
    setDocument(prev => ({ ...prev, content: newContent }))

    // Track that this specific suggestion has been applied
    setAppliedSuggestions(prev => new Set([...prev, original]))

    toast.success('Applied suggestion')
  }

  const handleApplyFullCorrection = (correctedText) => {
    setDocument(prev => ({ ...prev, content: correctedText }))
    setFullCorrectionApplied(true)
    toast.success('Document updated with full correction')
  }

  const highlightText = (originalText) => {
    if (!originalText || !quillRef.current) return

    try {
      const quill = quillRef.current.getEditor()
      const content = quill.getContents()
      const text = quill.getText()

      // Find the position of the original text in the plain text
      const index = text.indexOf(originalText.trim())
      if (index === -1) return

      // Convert plain text position to Delta position
      let charCount = 0
      let opsIndex = 0

      for (let i = 0; i < content.ops.length; i++) {
        const op = content.ops[i]
        if (typeof op.insert === 'string') {
          const opLength = op.insert.length
          if (charCount <= index && charCount + opLength > index) {
            opsIndex = i
            break
          }
          charCount += opLength
        }
      }

      // Set the selection to highlight the text
      const startIndex = index
      const endIndex = index + originalText.trim().length
      quill.setSelection(startIndex, endIndex - startIndex)

      // Apply highlighting format
      quill.format('background', '#fef3c7') // Light yellow background
    } catch (error) {
      console.warn('Failed to highlight text:', error)
    }
  }

  const unhighlightText = () => {
    if (!quillRef.current) return

    try {
      const quill = quillRef.current.getEditor()

      // Remove any existing background highlighting
      const range = quill.getSelection()
      if (range) {
        quill.format('background', false)
      }
    } catch (error) {
      console.warn('Failed to unhighlight text:', error)
    }
  }

  const renderPreview = (text) => {
    // If in markdown mode, render markdown as HTML, otherwise render HTML directly
    if (editorMode === 'markdown') {
      return (
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 mt-6 text-gray-900">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-bold mb-2 mt-4 text-gray-900">{children}</h3>,
              p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="mb-4 ml-6 list-disc text-gray-700">{children}</ul>,
              ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal text-gray-700">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              code: ({ inline, children }) => inline ? (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
              ) : (
                <code className="block bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto">{children}</code>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border-collapse border border-gray-300">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
              th: ({ children }) => (
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-4 py-2 text-gray-700">{children}</td>
              ),
              a: ({ children, href }) => (
                <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              )
            }}
          >
            {text || '*No content to preview*'}
          </ReactMarkdown>
        </div>
      )
    } else {
      // Rich text mode - render HTML directly
      return <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: text }} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4" role="banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
              Back to Dashboard
            </button>

            <div className="h-6 border-l border-gray-300" aria-hidden="true"></div>

            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <span className="text-sm text-gray-600" aria-live="polite">
                {id ? 'Editing Document' : 'New Document'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Word/Character Count */}
            <div className="text-sm text-gray-600">
              {wordCount} words • {charCount} characters
            </div>

            {/* Auto-save Status */}
            {autoSaveStatus && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                {autoSaveStatus}
              </div>
            )}

            {/* Editor Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditorMode(editorMode === 'rich-text' ? 'markdown' : 'rich-text')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  editorMode === 'markdown'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={`Switch to ${editorMode === 'rich-text' ? 'Markdown' : 'Rich Text'} editor`}
              >
                {editorMode === 'markdown' ? '📝' : '✨'} {editorMode === 'markdown' ? 'MD' : 'RT'}
              </button>
            </div>

            {/* Preview Toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>

            {/* File Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !document.title.trim()}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>

            {/* Export Button */}
            {id && (
              <DocumentExport
                documentId={id}
                documentTitle={document.title}
                disabled={!id || loading}
              />
            )}
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 flex">
        {/* Formatting Toolbar */}
        {!previewMode && (
          <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
            <button
              onClick={handleGrammarCheck}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Grammar Check"
              disabled={!document.content.replace(/<[^>]*>/g, '').trim()}
            >
              <SpellCheck className="w-4 h-4" />
            </button>

            {id && (
              <button
                onClick={handleAddChild}
                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded"
                title="Add Child Document"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 flex flex-col">
          {/* Title Input */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <input
              type="text"
              placeholder="Document Title..."
              value={document.title}
              onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-2xl font-bold text-gray-900 border-none outline-none placeholder-gray-400"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6">
            {previewMode ? (
              renderPreview(document.content)
            ) : editorMode === 'markdown' ? (
              <MarkdownEditor
                value={document.content}
                onChange={(content) => setDocument(prev => ({ ...prev, content }))}
                placeholder="Start writing in Markdown..."
                className="h-[calc(100vh-320px)]"
              />
            ) : (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={document.content}
                onChange={(content) => setDocument(prev => ({ ...prev, content }))}
                className="h-[calc(100vh-300px)]"
                placeholder="Start writing your document..."
              />
            )}
          </div>
        </div>

        {/* Grammar Suggestions Panel */}
        {showSuggestions && (
          <SuggestionPanel
            suggestions={grammarSuggestions}
            onClose={() => setShowSuggestions(false)}
            onApplySuggestion={handleApplySuggestion}
            onApplyFullCorrection={handleApplyFullCorrection}
            fullCorrectionApplied={fullCorrectionApplied}
            appliedSuggestions={appliedSuggestions}
            onHighlightText={highlightText}
            onUnhighlightText={unhighlightText}
          />
        )}

        {/* Toggle Suggestions Button */}
        {!showSuggestions && grammarSuggestions && (
          <button
            onClick={() => setShowSuggestions(true)}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-md shadow-lg hover:bg-blue-700 transition-colors"
            title="Show grammar suggestions"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Add Child Modal */}
        {showAddChildModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Child Document</h3>
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AddChildForm
                onSubmit={handleCreateChild}
                onCancel={() => setShowAddChildModal(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Screen reader status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {screenReaderStatus}
      </div>
    </div>
  )
}

const AddChildForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(title, content)
    setTitle('')
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="child-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="child-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter child document title"
          required
        />
      </div>

      <div>
        <label htmlFor="child-content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="child-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Enter child document content (optional)"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Create Child
        </button>
      </div>
    </form>
  )
}

export default TextEditor
