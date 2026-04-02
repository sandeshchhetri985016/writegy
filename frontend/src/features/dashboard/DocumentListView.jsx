import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  PenTool,
  Folder,
  FolderOpen,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Type
} from 'lucide-react'
import toast from 'react-hot-toast'
import { documentApi } from '../../lib/api'

const ListItem = ({ document, level = 0, onEdit, onDelete, onAddChild, expandedItems, onToggle, hasChildren }) => {
  const queryClient = useQueryClient()
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildTitle, setNewChildTitle] = useState('')
  const [newChildContent, setNewChildContent] = useState('')
  const [newChildType, setNewChildType] = useState('text')
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const indent = level * 20

  const handleAddChildSubmit = async (e) => {
    e.preventDefault()
    if (!newChildTitle.trim()) {
      toast.error('Title is required')
      return
    }

    setIsAddingChild(true)
    try {
      let newDocId;
      
      // Route to the correct API based on the selected type
      if (newChildType === 'canvas') {
        const response = await documentApi.createCanvasDocument(newChildTitle, '{}');
        newDocId = response?.data?.id;
        console.log('Canvas document created, response:', response?.data);
      } else {
        const response = await documentApi.uploadDocument(null, newChildTitle, newChildContent);
        newDocId = response?.data?.id;
        console.log('Text document created, response:', response?.data);
      }

      console.log('New document ID:', newDocId, 'Setting parent to:', document.id);

      // Link the new document to the current parent
      if (newDocId) {
        await documentApi.setDocumentParent(newDocId, document.id)
        toast.success(`Child ${newChildType === 'canvas' ? 'canvas' : 'document'} created successfully!`)
        setNewChildTitle('')
        setNewChildContent('')
        setNewChildType('text')
        setShowAddChild(false)
        // Replaced window.location.reload() with proper cache invalidation!
        queryClient.invalidateQueries({ queryKey: ['documents'] })
      } else {
        toast.error('Failed to get document ID from server response')
      }
    } catch (error) {
      console.error('Failed to create child document:', error)
      toast.error('Failed to create child document')
    } finally {
      setIsAddingChild(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Main Document Item */}
      <div
        className={`group flex items-center py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
          isHovered 
            ? 'bg-brand-50 dark:bg-brand-900/20 shadow-sm' 
            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
        }`}
        style={{ paddingLeft: `${indent}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(document.id)
            }}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {expandedItems.has(document.id) ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Document Icon */}
        <div className="mr-3 flex-shrink-0">
          {hasChildren ? (
            expandedItems.has(document.id) ? (
              <FolderOpen className="w-5 h-5 text-brand-500" />
            ) : (
              <Folder className="w-5 h-5 text-brand-500" />
            )
          ) : document.contentType === 'canvas' ? (
            <PenTool className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          ) : (
            <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          )}
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <Link
              to={`/editor/${document.id}`}
              className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 truncate hover:text-brand-600 dark:hover:text-brand-400 transition-colors pr-2"
            >
              {document.title}
            </Link>
            {level > 0 && (
              <span className="ml-2 badge-brand text-xs flex-shrink-0">
                Child
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center space-x-1 transition-all duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowAddChild(!showAddChild)
            }}
            className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-colors"
            title="Add child document"
          >
            <Plus className="w-4 h-4" />
          </button>
          <Link
            to={`/editor/${document.id}`}
            className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
            title="Edit document"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(document.id, document.title)
            }}
            className="p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg transition-colors"
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Child Form */}
      {showAddChild && (
        <div
          className="mx-4 mb-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in"
          style={{ marginLeft: `${32 + indent}px` }}
        >
          <form onSubmit={handleAddChildSubmit} className="space-y-3">
            {/* Document Type Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Document Type
              </label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setNewChildType('text')}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    newChildType === 'text'
                      ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Text Document
                </button>
                <button
                  type="button"
                  onClick={() => setNewChildType('canvas')}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    newChildType === 'canvas'
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
              <input
                type="text"
                value={newChildTitle}
                onChange={(e) => setNewChildTitle(e.target.value)}
                placeholder="Child document title..."
                className="input text-sm"
                required
              />
            </div>
            {newChildType === 'text' && (
              <div>
                <textarea
                  value={newChildContent}
                  onChange={(e) => setNewChildContent(e.target.value)}
                  placeholder="Child document content (optional)..."
                  rows={2}
                  className="input text-sm resize-none"
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddChild(false)
                  setNewChildTitle('')
                  setNewChildContent('')
                  setNewChildType('text')
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingChild}
                className="btn-primary text-sm"
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

  const buildHierarchy = (docs) => {
    const docMap = new Map()
    const roots = []

    docs.forEach(doc => {
      doc.children = []
      docMap.set(doc.id, doc)
    })

    docs.forEach(doc => {
      if (doc.parentId) {
        const parent = docMap.get(doc.parentId)
        if (parent) {
          parent.children.push(doc)
        } else {
          roots.push(doc)
        }
      } else {
        roots.push(doc)
      }
    })

    return roots
  }

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
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No documents yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
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