import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { documentApi } from '../../lib/api'
import { FileText, Upload, Trash2, Edit, Plus, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

function UserDashboard() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await documentApi.getAllDocuments()
      setDocuments(response.data)
    } catch (error) {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  // For now, we'll just navigate to editor for new documents
  const handleNewDocument = () => {
    navigate('/editor')
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await documentApi.deleteDocument(documentId)
      setDocuments(documents.filter(doc => doc.id !== documentId))
      toast.success('Document deleted successfully')
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }

  const handleEditDocument = (documentId) => {
    navigate(`/editor/${documentId}`)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Writegy Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Action Buttons */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleNewDocument}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Document
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload File
            </button>
          </div>

          {/* Documents Grid */}
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first document.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleNewDocument}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Create your first document
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {documents.map((document) => (
                  <li key={document.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="flex-shrink-0 h-6 w-6 text-gray-400" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {document.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(document.createdAt).toLocaleDateString()} •
                              {document.content?.length ? ` ${(document.content.length / 1000).toFixed(1)}KB` : ' Empty'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditDocument(document.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit document"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Statistics */}
          <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Documents
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {documents.length}
              </dd>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard
