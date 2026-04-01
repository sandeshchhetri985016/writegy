import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { documentApi } from '../../lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Clock,
  TreePine,
  List,
  PenTool,
  ChevronDown
} from 'lucide-react'
import DocumentTreeView from './DocumentTreeView'
import DocumentListView from './DocumentListView'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [showNewDocMenu, setShowNewDocMenu] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640)
  const newDocMenuRef = useRef(null)

  // React Query handles fetching, caching, and loading states!
  const { data: response, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentApi.getAllDocuments,
    enabled: !!user && !authLoading, // Only run if user is loaded
  })

  const documents = response?.data || []
  const loading = authLoading || documentsLoading

  // Listen for window resize to detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (newDocMenuRef.current && !newDocMenuRef.current.contains(event.target)) {
        setShowNewDocMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDeleteDocument = async (documentId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      await documentApi.deleteDocument(documentId)
      toast.success('Document deleted successfully')
      // INVALIDATE: Tells React Query the cache is dirty, triggering a background refetch
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.content && doc.content.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900">
      {/* Left Sidebar - Documents */}
      <div className="w-full sm:w-64 md:w-72 lg:w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Documents</h2>
            
            {/* Bear-style Add Note Button with Dropdown - All Screen Sizes */}
            <div className="relative" ref={newDocMenuRef}>
              <button
                onClick={() => setShowNewDocMenu(!showNewDocMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Add new document"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Note</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showNewDocMenu ? 'rotate-180' : ''}`} />
              </button>

              {showNewDocMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowNewDocMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 card py-2 z-20 animate-fade-in shadow-lg">
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Create New</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/editor?type=text"
                        onClick={() => setShowNewDocMenu(false)}
                        className="flex items-center px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                          <p className="font-medium">Text Document</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Markdown writing</p>
                        </div>
                      </Link>
                      <Link
                        to="/editor?type=canvas"
                        onClick={() => setShowNewDocMenu(false)}
                        className="flex items-center px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mr-3">
                          <PenTool className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                        </div>
                        <div>
                          <p className="font-medium">Canvas Notebook</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Drawing & sketching</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 text-sm"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mt-4">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <TreePine className="w-4 h-4 mr-2" />
              Tree
            </button>
          </div>
        </div>

        {/* Documents List or Tree View (Tree only on small screens) */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                {searchTerm ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by creating your first document.'
                }
              </p>
            </div>
          ) : viewMode === 'tree' && isSmallScreen ? (
            <DocumentTreeView
              documents={filteredDocuments}
              onDelete={handleDeleteDocument}
            />
          ) : (
            <DocumentListView
              documents={filteredDocuments}
              onDelete={handleDeleteDocument}
            />
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Continue your writing journey or start something new
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'tree' ? (
            <div className="h-full">
              <DocumentTreeView
                documents={filteredDocuments}
                onDelete={handleDeleteDocument}
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="card p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-4">
                        <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Documents</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{documents.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center mr-4">
                        <Edit className="w-6 h-6 text-success-600 dark:text-success-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Words Written</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {documents.reduce((total, doc) => total + (doc.wordCount || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mr-4">
                        <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {documents.length > 0
                            ? formatDate(Math.max(...documents.map(doc => new Date(doc.updatedAt))))
                            : 'No documents yet'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard