import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { documentApi } from '../../lib/api'
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Clock,
  FileType,
  Trash2,
  Edit,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  TreePine,
  List
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
  const [viewMode, setViewMode] = useState('list') // 'list' or 'tree'

  useEffect(() => {
    // Only load documents when user is authenticated and auth is not loading
    if (user && !authLoading) {
      loadDocuments()
    } else if (!authLoading) {
      // If auth is done but no user, stop loading
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
      loadDocuments() // Refresh the list
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  // Check if user has a saved draft
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

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'ARCHIVED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Documents */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
            <Link
              to="/editor"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 mt-3">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TreePine className="w-4 h-4 mr-2" />
              Tree
            </button>
          </div>
        </div>

        {/* Documents Content - Only show list view in sidebar */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Continue your writing journey or start something new
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'tree' ? (
            /* Full-screen Tree View */
            <div className="h-full">
              <DocumentTreeView
                documents={filteredDocuments}
                onDelete={handleDeleteDocument}
                onRefresh={loadDocuments}
              />
            </div>
          ) : (
            /* Default Dashboard Content */
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Draft Banner */}
                {hasDraft() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">
                            Continue writing?
                          </h3>
                          <p className="text-sm text-blue-600">
                            You have unsaved changes from your last session.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/editor?draft=true"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                      >
                        Continue Draft
                      </Link>
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Documents</p>
                        <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                      <Edit className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Words Written</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {documents.reduce((total, doc) => total + (doc.wordCount || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                      <Clock className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Last Updated</p>
                        <p className="text-sm font-bold text-gray-900">
                          {documents.length > 0
                            ? formatDate(Math.max(...documents.map(doc => new Date(doc.updatedAt))))
                            : 'No documents yet'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Empty State for Main Content */}
                <div className="text-center py-16">
                  <FileText className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Ready to write?</h3>
                  <p className="mt-2 text-gray-500">
                    Switch to Tree view to see your document hierarchy, or select a document from the sidebar to get started.
                  </p>
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
