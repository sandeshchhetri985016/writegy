import { useState, useEffect, useRef, forwardRef, Suspense } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { documentApi, grammarApi } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
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
  Plus,
  PenTool,
  Type
} from 'lucide-react'
import CanvasEditor from './CanvasEditor'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
// Import worker from the mjs bundle for Vite compatibility
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import SuggestionPanel from './SuggestionPanel'
import MarkdownEditor from './MarkdownEditor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DocumentExport from './DocumentExport'

// Custom styles for Quill editor to increase font size
const quillStyles = `
  .ql-editor {
    font-size: 16px;
    line-height: 1.75;
  } 
  .ql-toolbar {
    font-size: 14px;
  }
`

// Wrapper component for ReactQuill to avoid findDOMNode warning
const QuillWrapper = forwardRef((props, ref) => {
  const quillRef = useRef(null)
  
  // Expose the Quill editor instance to the parent
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(quillRef.current)
      } else {
        ref.current = quillRef.current
      }
    }
  }, [ref])
  
  return (
    <ReactQuill {...props} ref={quillRef} modules={quillModules} />
  )
})

// Custom Quill modules configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean']
  ]
}

// Helper function to decode HTML entities
const decodeHTML = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

// Helper function to escape text to HTML entities
const escapeHTML = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const TextEditor = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  // Inject custom Quill styles
  useEffect(() => {
    if (typeof document !== 'undefined' && document.head) {
      const style = document.createElement('style')
      style.textContent = quillStyles
      document.head.appendChild(style)
      return () => {
        if (document.head && document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    }
  }, [])

  const documentType = searchParams.get('type') || 'text' // 'text' or 'canvas' from URL

  const [document, setDocument] = useState({
    title: '',
    content: ''
  })
  const [contentType, setContentType] = useState(documentType) // Initialize from URL param
  const [canvasData, setCanvasData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [editorMode, setEditorMode] = useState('rich-text')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const [lastSavedContent, setLastSavedContent] = useState('')
  const [grammarSuggestions, setGrammarSuggestions] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [fullCorrectionApplied, setFullCorrectionApplied] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set())
  const [highlightedText, setHighlightedText] = useState('')
  const [screenReaderStatus, setScreenReaderStatus] = useState('')
  const [currentDocumentId, setCurrentDocumentId] = useState(id)
  const isSavingRef = useRef(false)
  const quillRef = useRef(null)

  useEffect(() => {
    if (id && id !== 'undefined') {
      loadDocument()
    }
  }, [id])

  useEffect(() => {
    const text = document.content.replace(/<[^>]*>/g, ' ')
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length
    setWordCount(words)
    setCharCount(chars)
  }, [document.content])

  useEffect(() => {
    if (currentDocumentId) {
      loadDocument()
    }
  }, [currentDocumentId])

  // Auto-save to server every 3 seconds
  useEffect(() => {
    if (!document.title.trim() && !document.content.trim() && !canvasData) return
    if (document.content === lastSavedContent && !canvasData) return

    setAutoSaveStatus('Saving...')
    const saveTimeout = setTimeout(() => {
      autoSaveToServer()
    }, 3000)

    return () => clearTimeout(saveTimeout)
  }, [document.content, document.title, canvasData, lastSavedContent, user])

  const autoSaveToServer = async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) {
      console.log('Auto-save skipped: save already in progress')
      return
    }

    const hasContent = document.title.trim() || document.content.trim() || canvasData
    if (!hasContent) {
      // If empty, delete the document if it exists
      if (currentDocumentId) {
        try {
          await documentApi.deleteDocument(currentDocumentId)
          setCurrentDocumentId(null)
          setDocument({ title: '', content: '' })
          setCanvasData(null)
          setAutoSaveStatus('Empty document discarded')
          setTimeout(() => setAutoSaveStatus(''), 3000)
        } catch (error) {
          console.error('Failed to delete empty document:', error)
        }
      }
      return
    }

    isSavingRef.current = true
    try {
      if (currentDocumentId) {
        // Update existing document
        if (contentType === 'canvas') {
          await documentApi.updateCanvasData(currentDocumentId, canvasData)
          await documentApi.updateDocument(currentDocumentId, {
            title: document.title || 'Untitled'
          })
        } else {
          await documentApi.updateDocument(currentDocumentId, {
            title: document.title || 'Untitled',
            content: document.content
          })
        }
      } else {
        // Create new document
        if (contentType === 'canvas') {
          const dataToSend = canvasData || '{}'
          const response = await documentApi.createCanvasDocument(
            document.title || 'Untitled',
            dataToSend
          )
          setCurrentDocumentId(response.data.id)
          // Navigate to the new document URL
          navigate(`/editor/${response.data.id}`, { replace: true })
        } else {
          const response = await documentApi.uploadDocument(
            null,
            document.title || 'Untitled',
            document.content
          )
          setCurrentDocumentId(response.data.id)
          // Navigate to the new document URL
          navigate(`/editor/${response.data.id}`, { replace: true })
        }
      }
      // Invalidate documents cache after successful save
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setLastSavedContent(document.content)
      setAutoSaveStatus('Saved')
      setTimeout(() => setAutoSaveStatus(''), 3000)
    } catch (error) {
      console.error('Auto-save failed:', error)
      setAutoSaveStatus('Save failed')
      setTimeout(() => setAutoSaveStatus(''), 3000)
    } finally {
      isSavingRef.current = false
    }
  }

  const loadDocument = async () => {
    try {
      setLoading(true)
      const response = await documentApi.getDocument(id)
      setDocument({
        title: response.data.title,
        content: response.data.content
      })
      // Set content type from loaded document
      if (response.data.contentType) {
        setContentType(response.data.contentType)
      }
      // Load canvas data if it's a canvas document
      if (response.data.canvasData) {
        setCanvasData(response.data.canvasData)
      }
    } catch (error) {
      console.error('Failed to load document:', error)
      toast.error('Failed to load document')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) {
      console.log('Manual save skipped: save already in progress')
      return
    }

    if (!document.title.trim() && !document.content.trim() && !canvasData) {
      toast.error('Please add some content before saving')
      return
    }

    isSavingRef.current = true
    try {
      setSaving(true)
      if (currentDocumentId) {
        // Update existing document
        if (contentType === 'canvas') {
          await documentApi.updateCanvasData(currentDocumentId, canvasData)
          await documentApi.updateDocument(currentDocumentId, {
            title: document.title || 'Untitled'
          })
        } else {
          await documentApi.updateDocument(currentDocumentId, {
            title: document.title || 'Untitled',
            content: document.content
          })
        }
        toast.success('Document saved successfully')
      } else {
        // Create new document
        if (contentType === 'canvas') {
          const dataToSend = canvasData || '{}'
          const response = await documentApi.createCanvasDocument(
            document.title || 'Untitled',
            dataToSend
          )
          toast.success('Canvas notebook created successfully')
          setCurrentDocumentId(response.data.id)
          // Navigate to the new document URL
          navigate(`/editor/${response.data.id}`, { replace: true })
        } else {
          const response = await documentApi.uploadDocument(
            null,
            document.title || 'Untitled',
            document.content
          )
          toast.success('Text document created successfully')
          setCurrentDocumentId(response.data.id)
          // Navigate to the new document URL
          navigate(`/editor/${response.data.id}`, { replace: true })
        }
      }
      // Invalidate documents cache after successful save
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setLastSavedContent(document.content)
    } catch (error) {
      console.error('Failed to save document:', error)
      toast.error('Failed to save document')
    } finally {
      setSaving(false)
      isSavingRef.current = false
    }
  }

  const extractTextFromFile = async (file) => {
    const fileType = file.type
    if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let text = ''
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i)
        const textContent = await page.getTextContent()
        text += textContent.items.map(item => item.str).join(' ') + '\n'
      }
      return text
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } else if (fileType === 'application/msword') {
      throw new Error('DOC files are not supported for text extraction. Please convert to DOCX or PDF.')
    } else {
      throw new Error('Unsupported file type')
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PDF, DOC, or DOCX file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setLoading(true)
      toast('Extracting text from file...')
      const extractedText = await extractTextFromFile(file)
      setDocument({
        title: file.name.replace(/\.[^/.]+$/, ''),
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
    const plainText = document.content.replace(/<[^>]*>/g, ' ')
    if (!plainText.trim()) {
      toast.error('Please write some content first')
      return
    }

    setIsFixing(true)
    try {
      setGrammarSuggestions('Checking grammar...')
      setShowSuggestions(true)
      setFullCorrectionApplied(false)
      setAppliedSuggestions(new Set())

      const response = await grammarApi.checkGrammar(plainText)

      if (response.data) {
        setGrammarSuggestions(response.data)
        toast.success('Grammar analysis complete!')
        console.log('Full Grammar Analysis:', response.data)
      } else {
        setGrammarSuggestions('Grammar check complete! No issues found.')
        toast.success('Grammar check complete! No issues found.')
      }
    } catch (error) {
      console.error('Grammar check failed:', error)
      
      // Handle 504 Gateway Timeout specifically
      if (error.response?.status === 504) {
        toast.error('AI service timed out. Please try again in a moment.')
        setGrammarSuggestions('The AI service took too long to respond. Please try again.')
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timed out. The AI service may be busy.')
        setGrammarSuggestions('Request timed out. Please try again.')
      } else {
        toast.error('Grammar check failed. Please try again.')
        setGrammarSuggestions('Grammar check failed. Please try again.')
      }
    } finally {
      setIsFixing(false)
    }
  }

  const handleAddChild = () => {
    setShowAddChildModal(true)
  }

  const handleCreateChild = async (title, content, type) => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      let newDocId;
      
      // Route to the correct API based on the selected type
      if (type === 'canvas') {
        const response = await documentApi.createCanvasDocument(title, '{}');
        // Axios response: response.data is the response body (DocumentDTO)
        newDocId = response?.data?.id;
        console.log('Canvas document created, response:', response?.data);
      } else {
        const response = await documentApi.uploadDocument(null, title, content);
        // Axios response: response.data is the response body (DocumentDTO)
        newDocId = response?.data?.id;
        console.log('Text document created, response:', response?.data);
      }

      console.log('New document ID:', newDocId, 'Setting parent to:', id);

      // Link the new document to the current parent
      if (newDocId) {
        await documentApi.setDocumentParent(newDocId, id)
        toast.success(`Child ${type === 'canvas' ? 'canvas' : 'document'} created successfully!`)
        setShowAddChildModal(false)
        // Clear the new child document from state to prevent re-render issues
        queryClient.invalidateQueries({ queryKey: ['documents'] })
      } else {
        toast.error('Failed to get document ID from server response')
      }
    } catch (error) {
      console.error('Failed to create child document:', error)
      toast.error('Failed to create child document')
    }
  }

  const handleApplySuggestion = (original, replacement) => {
    const unescapedOriginal = original.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
    const unescapedReplacement = replacement.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
    
    if (document.content.includes(unescapedOriginal)) {
      const newContent = document.content.replace(unescapedOriginal, unescapedReplacement)
      setDocument(prev => ({ ...prev, content: newContent }))
      setAppliedSuggestions(prev => new Set([...prev, original]))
      toast.success('Applied suggestion')
      return
    }
    
    const normalizeForComparison = (text) => decodeHTML(text).replace(/\s+/g, ' ').trim()
    const normalizedContent = normalizeForComparison(document.content)
    const normalizedOriginal = normalizeForComparison(unescapedOriginal)
    const normalizedIndex = normalizedContent.indexOf(normalizedOriginal)
    
    if (normalizedIndex === -1) {
      toast.error('Could not find the original text to replace')
      return
    }
    
    const targetOriginal = escapeHTML(unescapedOriginal);
    const targetReplacement = escapeHTML(unescapedReplacement);
    
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const originalWords = targetOriginal.split(/\s+/).filter(word => word.length > 0)
    
    if (originalWords.length === 0) {
      toast.error('Could not find the original text to replace')
      return
    }
    
    const pattern = originalWords.map(word => escapeRegex(word)).join('\\s+')
    const regex = new RegExp(pattern, 'g')
    
    if (!regex.test(document.content)) {
      toast.error('Could not find the original text to replace')
      return
    }
    
    regex.lastIndex = 0
    const newContent = document.content.replace(regex, targetReplacement)
    setDocument(prev => ({ ...prev, content: newContent }))
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
      const text = quill.getText()
      const index = text.indexOf(originalText.trim())
      if (index === -1) return
      quill.formatText(index, originalText.trim().length, 'background', '#fef3c7')
    } catch (error) {
      console.warn('Failed to highlight text:', error)
    }
  }

  const unhighlightText = () => {
    if (!quillRef.current) return
    try {
      const quill = quillRef.current.getEditor()
      const length = quill.getLength()
      quill.formatText(0, length, 'background', false)
    } catch (error) {
      console.warn('Failed to unhighlight text:', error)
    }
  }

  // Keyboard shortcuts (placed after all function definitions)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + S - Save document
      if (modifier && e.key === 's') {
        e.preventDefault()
        if (document.title.trim()) {
          handleSave()
        }
        return
      }

      // Ctrl/Cmd + G - Grammar check
      if (modifier && e.key === 'g') {
        e.preventDefault()
        if (document.content.replace(/<[^>]*>/g, '').trim()) {
          handleGrammarCheck()
        }
        return
      }

      // Ctrl/Cmd + P - Toggle preview
      if (modifier && e.key === 'p') {
        e.preventDefault()
        setPreviewMode(prev => !prev)
        return
      }

      // Escape - Close panels
      if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false)
        } else if (showAddChildModal) {
          setShowAddChildModal(false)
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [document.title, document.content, showSuggestions, showAddChildModal])

  const renderPreview = (text) => {
    if (editorMode === 'markdown') {
      return (
        <div className="prose prose-lg max-w-editor mx-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1>{children}</h1>,
              h2: ({ children }) => <h2>{children}</h2>,
              h3: ({ children }) => <h3>{children}</h3>,
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul>{children}</ul>,
              ol: ({ children }) => <ol>{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              blockquote: ({ children }) => <blockquote>{children}</blockquote>,
              strong: ({ children }) => <strong>{children}</strong>,
              em: ({ children }) => <em>{children}</em>,
              code: ({ inline, children }) => inline ? (
                <code>{children}</code>
              ) : (
                <code>{children}</code>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table>{children}</table>
                </div>
              ),
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
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
      return <div className="prose prose-lg max-w-editor mx-auto" dangerouslySetInnerHTML={{ __html: text }} />
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
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-2 sm:px-3 md:px-4 lg:px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto gap-1 md:gap-2 lg:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded-md px-1 sm:px-2 py-1 transition-colors"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline text-sm font-medium">Back to Dashboard</span>
            </button>

          </div>

          <div className="flex items-center space-x-3">
            {/* Word/Character Count */}
            <div className="text-sm text-slate-500 dark:text-slate-400 hidden lg:block">
              {wordCount} words • {charCount} characters
            </div>

            {/* Auto-save Status */}
            {autoSaveStatus && (
              <div className="hidden md:flex items-center text-sm text-success-600 dark:text-success-400 animate-fade-in">
                <CheckCircle className="w-4 h-4 mr-1" />
                {autoSaveStatus}
              </div>
            )}


            {/* Preview Toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="btn-secondary hidden md:flex"
            >
              {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>

            {/* File Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary hidden lg:flex"
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
              className="btn-primary h-10 min-w-[60px] sm:min-w-[100px]"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="hidden sm:inline ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
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
      <div className="flex-1 flex overflow-hidden">
        {/* Formatting Toolbar */}
        {!previewMode && contentType === 'text' && (
          <div className="w-14 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 space-y-3 flex-shrink-0">
            <button
              onClick={handleGrammarCheck}
              className={`p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                isFixing
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 cursor-wait'
                  : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
              }`}
              title={isFixing ? 'Analyzing...' : 'Grammar Check (Ctrl+G)'}
              disabled={isFixing || !document.content.replace(/<[^>]*>/g, '').trim()}
            >
              {isFixing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="text-xs font-medium">Thinking...</span>
                </>
              ) : (
                <SpellCheck className="w-5 h-5" />
              )}
            </button>

            {/* Text Editor Mode Toggle */}
            <div className="flex flex-col items-center space-y-2 py-2 border-t border-slate-200 dark:border-slate-700 w-full px-2 mt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Mode</span>
              <button
                onClick={() => setEditorMode('rich-text')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editorMode === 'rich-text'
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Rich Text Editor"
              >
                <Type className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditorMode('markdown')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editorMode === 'markdown'
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Markdown Editor"
              >
                <span className="text-sm font-bold">MD</span>
              </button>
            </div>

            {id && (
              <button
                onClick={handleAddChild}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-success-600 dark:hover:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-all duration-200"
                title="Add Child Document"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-800">
          {/* Canvas Mode - No scroll wrapper, canvas fills the space */}
          {contentType === 'canvas' ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            }>
              <div className="flex flex-col h-full overflow-hidden">
                {/* Title Input - Same as text mode */}
                <input
                  type="text"
                  placeholder="Document Title..."
                  value={document.title}
                  onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full max-w-[800px] mx-auto px-4 py-3 text-2xl font-semibold bg-white border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 flex-shrink-0"
                />
                <CanvasEditor
                  initialData={canvasData}
                  onSave={(data) => {
                    setCanvasData(data)
                    // State update triggers the useEffect auto-save below
                  }}
                />
              </div>
            </Suspense>
          ) : (
            /* Text Mode - Scrollable content area */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-editor mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                {/* Title Input - Seamless H1 Style */}
                <input
                  type="text"
                  placeholder="Document Title..."
                  value={document.title}
                  onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-none outline-none focus:ring-0 placeholder-slate-400 dark:placeholder-slate-500 font-sans mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700"
                />

                {/* Content Area - Text content types */}
                {previewMode ? (
                  renderPreview(document.content)
                ) : editorMode === 'markdown' ? (
                  <MarkdownEditor
                    value={document.content}
                    onChange={(content) => setDocument(prev => ({ ...prev, content }))}
                    placeholder="Start writing in Markdown..."
                    className="min-h-[400px]"
                  />
                ) : (
                  <QuillWrapper
                    ref={quillRef}
                    theme="snow"
                    value={document.content}
                    onChange={(content) => setDocument(prev => ({ ...prev, content }))}
                    className="min-h-[400px]"
                    placeholder="Start writing your document..."
                  />
                )}
              </div>
            </div>
          )}
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
            className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-brand-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-brand-700 transition-colors z-10"
            title="Show grammar suggestions"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Add Child Modal */}
        {showAddChildModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-fade-in">
            <div className="card p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Add Child Document</h3>
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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
  const [docType, setDocType] = useState('text')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(title, content, docType)
    setTitle('')
    setContent('')
    setDocType('text')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Document Type Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Document Type
        </label>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <button
            type="button"
            onClick={() => setDocType('text')}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              docType === 'text' 
                ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4 mr-2" />
            Text Document
          </button>
          <button
            type="button"
            onClick={() => setDocType('canvas')}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              docType === 'canvas' 
                ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4 mr-2" />
            Canvas Notebook
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="child-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="child-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Enter child document title"
          required
        />
      </div>

      {docType === 'text' && (
        <div className="animate-fade-in">
          <label htmlFor="child-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Initial Content
          </label>
          <textarea
            id="child-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="Enter content (optional)"
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Create Child
        </button>
      </div>
    </form>
  )
}

export default TextEditor