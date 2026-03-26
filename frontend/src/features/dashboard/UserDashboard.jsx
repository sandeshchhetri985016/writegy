import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { documentApi } from '../../lib/api'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Clock,
  TreePine,
  List,
  Sparkles
} from 'lucide-react'
import DocumentTreeView from './DocumentTreeView'
import DocumentListView from './DocumentListView'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    if (user && !authLoading) {
      loadDocuments()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await documentApi.getAllDocuments()
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      await documentApi.deleteDocument(documentId)
      toast.success('Document deleted successfully')
      loadDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  const hasDraft = () => {
    const draftKey = `writegy_draft_${user?.id || 'anonymous'}`
    return localStorage.getItem(draftKey) !== null
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Documents</h2>
            <Link
              to="/editor"
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Link>
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

        {/* Documents List */}
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
          ) : (
            <DocumentListView
              documents={filteredDocuments}
              onDelete={handleDeleteDocument}
              onRefresh={loadDocuments}
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
                onRefresh={loadDocuments}
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Draft Banner */}
                {hasDraft() && (
                  <div className="card p-4 border-l-4 border-l-brand-500 bg-brand-50/50 dark:bg-brand-950/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-4">
                          <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Continue writing?
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            You have unsaved changes from your last session.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/editor?draft=true"
                        className="btn-primary text-sm"
                      >
                        Continue Draft
                      </Link>
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* Quick Actions */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-brand-500" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                      to="/editor"
                      className="group flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-4 group-hover:bg-brand-200 dark:group-hover:bg-brand-800/30 transition-colors">
                        <Plus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">New Document</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Start writing something new</p>
                      </div>
                    </Link>
                    <Link
                      to="/editor?draft=true"
                      className="group flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-success-300 dark:hover:border-success-600 hover:bg-success-50 dark:hover:bg-success-950/20 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center mr-4 group-hover:bg-success-200 dark:group-hover:bg-success-800/30 transition-colors">
                        <Edit className="w-5 h-5 text-success-600 dark:text-success-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Continue Draft</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pick up where you left off</p>
                      </div>
                    </Link>
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