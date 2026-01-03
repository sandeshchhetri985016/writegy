import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Folder,
  FolderOpen,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { documentApi } from '../../lib/api'

const ListItem = ({ document, level = 0, onEdit, onDelete, onAddChild, expandedItems, onToggle, hasChildren }) => {
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildTitle, setNewChildTitle] = useState('')
  const [newChildContent, setNewChildContent] = useState('')
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const indent = level * 24 // 24px per level for clear hierarchy

  const handleAddChildSubmit = async (e) => {
    e.preventDefault()
    if (!newChildTitle.trim()) {
      toast.error('Title is required')
      return
    }

    setIsAddingChild(true)
    try {
      await documentApi.uploadDocument(null, newChildTitle, newChildContent)
      const response = await documentApi.getAllDocuments()
      const newDoc = response.data.find(doc => doc.title === newChildTitle)

      if (newDoc) {
        await documentApi.setDocumentParent(newDoc.id, document.id)
        toast.success('Child document created successfully!')
        setNewChildTitle('')
        setNewChildContent('')
        setShowAddChild(false)
        // Trigger refresh
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to create child document:', error)
      toast.error('Failed to create child document')
    } finally {
      setIsAddingChild(false)
    }
  }

  return (
    <div>
      {/* Main Document Item */}
      <div
        className={`flex items-center py-3 px-4 hover:bg-gray-50 rounded-md group transition-colors ${
          isHovered ? 'bg-blue-50' : ''
        }`}
        style={{ paddingLeft: `${16 + indent}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren && (
          <button
            onClick={() => onToggle(document.id)}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-2 flex-shrink-0"
          >
            {expandedItems.has(document.id) ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5 mr-2 flex-shrink-0" />}

        {/* Document Icon */}
        <div className="mr-3 flex-shrink-0">
          {hasChildren ? (
            expandedItems.has(document.id) ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <FileText className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 truncate">
              {document.title}
            </span>
            <span className="ml-2 text-xs text-gray-500">
              {document.wordCount || 0} words
            </span>
            {level > 0 && (
              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Child
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center space-x-1 transition-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => setShowAddChild(!showAddChild)}
            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
            title="Add child document"
          >
            <Plus className="w-3 h-3" />
          </button>
          <Link
            to={`/editor/${document.id}`}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Edit document"
          >
            <Edit className="w-3 h-3" />
          </Link>
          <button
            onClick={() => onDelete(document.id, document.title)}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Delete document"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Add Child Form */}
      {showAddChild && (
        <div
          className="ml-8 mr-4 mb-3 p-3 bg-gray-50 rounded-md border border-gray-200"
          style={{ marginLeft: `${16 + indent + 32}px` }}
        >
          <form onSubmit={handleAddChildSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                value={newChildTitle}
                onChange={(e) => setNewChildTitle(e.target.value)}
                placeholder="Child document title..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <textarea
                value={newChildContent}
                onChange={(e) => setNewChildContent(e.target.value)}
                placeholder="Child document content (optional)..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddChild(false)
                  setNewChildTitle('')
                  setNewChildContent('')
                }}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingChild}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isAddingChild ? 'Creating...' : 'Create Child'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

const DocumentListView = ({ documents, onDelete, onRefresh }) => {
  const [expandedItems, setExpandedItems] = useState(new Set())

  // Build hierarchical structure
  const buildHierarchy = (docs) => {
    const docMap = new Map()
    const roots = []

    // Create document map
    docs.forEach(doc => {
      doc.children = []
      docMap.set(doc.id, doc)
    })

    // Build tree
    docs.forEach(doc => {
      if (doc.parentId) {
        const parent = docMap.get(doc.parentId)
        if (parent) {
          parent.children.push(doc)
        } else {
          roots.push(doc) // Orphaned document, treat as root
        }
      } else {
        roots.push(doc)
      }
    })

    return roots
  }

  // Flatten tree for rendering with levels
  const flattenTree = (nodes, level = 0) => {
    const result = []
    nodes.forEach(node => {
      result.push({ ...node, level, hasChildren: node.children && node.children.length > 0 })
      if (expandedItems.has(node.id) && node.children) {
        result.push(...flattenTree(node.children, level + 1))
      }
    })
    return result
  }

  const hierarchy = buildHierarchy(documents)
  const flatList = flattenTree(hierarchy)

  const handleToggle = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first document.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {flatList.map(item => (
        <ListItem
          key={item.id}
          document={item}
          level={item.level}
          onEdit={() => {}}
          onDelete={onDelete}
          onAddChild={() => {}}
          expandedItems={expandedItems}
          onToggle={handleToggle}
          hasChildren={item.hasChildren}
        />
      ))}
    </div>
  )
}

export default DocumentListView
