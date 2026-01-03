import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Edit,
  Trash2,
  Plus,
  Minus,
  Maximize,
  RotateCcw
} from 'lucide-react'

const FlowchartNode = ({ document, position, onEdit, onDelete, onToggle, isExpanded, hasChildren, level, onDragStart, isDragging, isSelected, onNodeClick, currentPath }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseDown = (e) => {
    // Only start drag if not clicking on buttons
    const target = e.target.closest('button, a')
    if (!target) {
      e.stopPropagation()
      onNodeClick(document.id)
      onDragStart(document.id, e.clientX, e.clientY)
    }
  }

  return (
    <div
      data-node-id={document.id}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${
        isDragging ? '' : 'transition-all duration-300'
      } ${
        isHovered || isDragging || isSelected ? 'z-20' : 'z-10'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      {/* Handle (Top) - Input */}
      <div
        className={`absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-gray-400 border-2 border-white z-10 ${level === 0 ? 'opacity-0' : ''}`}
      />

      {/* Rectangular Card Node (React Flow style) */}
      <div
        className={`w-64 bg-white rounded-lg shadow-sm border transition-all duration-200 group ${
          isSelected
            ? 'border-blue-500 ring-1 ring-blue-500 shadow-md'
            : isHovered
              ? 'border-blue-300 shadow-md'
              : 'border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 rounded-t-md flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
              isExpanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-blue-500" />
            ) : (
              <FileText className="w-4 h-4 text-gray-400" />
            )}
            <span className="font-medium text-sm text-gray-700 truncate" title={document.title}>
              {document.title}
            </span>
          </div>
          
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle(document.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded text-gray-500"
            >
              {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-3">
          <p className="text-xs text-gray-500 line-clamp-3 min-h-[2.5rem]">
            {document.content || "No content"}
          </p>
          
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>{document.wordCount || 0} words</span>
            <span>Lvl {level}</span>
          </div>
        </div>

        {/* Actions Menu - appears on hover */}
        <div className={`absolute left-full top-0 pl-2 flex flex-col gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <Link
              to="/editor/new"
              state={{ parentId: document.id, from: currentPath }}
              className="p-2 bg-white text-green-600 hover:bg-green-50 rounded-full shadow-md border border-gray-100 flex items-center justify-center"
              title="Add child document"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="w-3 h-3" />
            </Link>
            <Link
              to={`/editor/${document.id}`}
              state={{ from: currentPath }}
              className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-md border border-gray-100"
              title="Edit document"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit className="w-3 h-3" />
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(document.id, document.title)
              }}
              className="p-2 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-md border border-gray-100"
              title="Delete document"
            >
              <Trash2 className="w-3 h-3" />
            </button>
      </div>
      </div>

      {/* Handle (Bottom) - Output */}
      {hasChildren && (
        <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-gray-400 border-2 border-white z-10" />
      )}
    </div>
  )
}

const FlowchartConnections = ({ connections, isDragging }) => {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -1, width: '100%', height: '100%', overflow: 'visible' }}>
      {connections.map((connection, index) => (
        <path
          key={index}
          d={`M ${connection.from.x} ${connection.from.y} C ${connection.from.x} ${(connection.from.y + connection.to.y) / 2}, ${connection.to.x} ${(connection.from.y + connection.to.y) / 2}, ${connection.to.x} ${connection.to.y}`}
          stroke="#b1b1b7"
          strokeWidth="2"
          fill="none"
          className={isDragging ? "" : "transition-all duration-300"}
        />
      ))}
    </svg>
  )
}

const DocumentTreeView = ({ documents: rawDocuments, onDelete, onRefresh }) => {
  const documents = useMemo(() => rawDocuments || [], [rawDocuments])
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)
  const [expandedNodes, setExpandedNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('writegy_expanded_nodes')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch (error) {
      return new Set()
    }
  })
  const [nodePositions, setNodePositions] = useState({})
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const [customPositions, setCustomPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('writegy_node_positions')
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      return {}
    }
  })
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const dragInitialPositions = useRef({})
  const dragStartMousePos = useRef({ x: 0, y: 0 })
  const hasInitializedView = useRef(false)

  // Hide the dashboard header when this component is mounted
  useEffect(() => {
    const headings = document.getElementsByTagName('h1')
    let headerContainer = null
    
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].textContent.includes('Welcome back')) {
        headerContainer = headings[i].closest('.bg-white.border-b')
        break
      }
    }

    if (headerContainer) {
      headerContainer.style.display = 'none'
      return () => {
        headerContainer.style.display = ''
      }
    }
  }, [])

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('writegy_node_positions', JSON.stringify(customPositions))
  }, [customPositions])

  useEffect(() => {
    localStorage.setItem('writegy_expanded_nodes', JSON.stringify(Array.from(expandedNodes)))
  }, [expandedNodes])

  // Build tree structure and map from flat documents list
  const { roots: treeData, docMap } = useMemo(() => {
    if (documents.length === 0) return { roots: [], docMap: new Map() }

    // Clone to avoid mutating props
    const docs = documents.map(d => ({ ...d, children: [] }))
    const map = new Map()
    const roots = []

    // Create document map
    docs.forEach(doc => {
      map.set(doc.id, doc)
    })

    // Build tree
    docs.forEach(doc => {
      if (doc.parentId) {
        const parent = map.get(doc.parentId)
        if (parent) {
          parent.children.push(doc)
        } else {
          roots.push(doc) // Orphaned document, treat as root
        }
      } else {
        roots.push(doc)
      }
    })

    // Sort children by tree order
    const sortChildren = (node) => {
      if (node.children) {
        node.children.sort((a, b) => (a.treeOrder || 0) - (b.treeOrder || 0))
        node.children.forEach(sortChildren)
      }
    }

    roots.forEach(sortChildren)
    return { roots, docMap: map }
  }, [documents])

  // Helper function to get all descendants of a node
  const getAllDescendants = useCallback((nodeId) => {
    const descendants = new Set()
    const addDescendants = (id) => {
      const node = docMap.get(id)
      if (node && node.children && node.children.length > 0) {
        node.children.forEach(child => {
          descendants.add(child.id)
          addDescendants(child.id)
        })
      }
    }
    addDescendants(nodeId)
    return descendants
  }, [docMap])

  // Calculate positions for flowchart layout
  const calculatePositions = useCallback((nodes) => {
    const positions = {}
    const levelHeight = 180
    const minNodeSpacing = 280 // Increased for wider cards

    // Helper to calculate subtree width
    const getSubtreeWidth = (node) => {
      if (!expandedNodes.has(node.id) || !node.children || node.children.length === 0) {
        return minNodeSpacing
      }
      const childrenWidth = node.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0)
      return Math.max(minNodeSpacing, childrenWidth)
    }

    // Helper to assign positions
    const assignPositions = (node, x, y, width) => {
      positions[node.id] = { x, y }

      if (expandedNodes.has(node.id) && node.children && node.children.length > 0) {
        let currentX = x - width / 2
        
        node.children.forEach(child => {
          const childWidth = getSubtreeWidth(child)
          assignPositions(child, currentX + childWidth / 2, y + levelHeight, childWidth)
          currentX += childWidth
        })
      }
    }

    const totalWidth = nodes.reduce((sum, root) => sum + getSubtreeWidth(root), 0)
    
    let currentX = -totalWidth / 2
    nodes.forEach(root => {
      const rootWidth = getSubtreeWidth(root)
      assignPositions(root, currentX + rootWidth / 2, 0, rootWidth)
      currentX += rootWidth
    })

    return positions
  }, [expandedNodes])

  // Calculate connection lines
  const calculateConnections = useCallback((positions) => {
    const connectionList = []

    documents.forEach(doc => {
      if (doc.parentId && positions[doc.id] && positions[doc.parentId]) {
        const parentPos = positions[doc.parentId]
        const childPos = positions[doc.id]

        connectionList.push({
          from: {
            x: parentPos.x,
            y: parentPos.y + 50 // Bottom of parent card (approx half height + padding)
          },
          to: {
            x: childPos.x,
            y: childPos.y - 50 // Top of child card
          }
        })
      }
    })

    return connectionList
  }, [documents])

  // Calculate effective positions and connections
  const effectivePositions = useMemo(() => ({ ...nodePositions, ...customPositions }), [nodePositions, customPositions])
  const connections = useMemo(() => calculateConnections(effectivePositions), [effectivePositions, calculateConnections])

  // Update positions and connections when data changes
  useEffect(() => {
    if (documents.length > 0) {
      const positions = calculatePositions(treeData)
      setNodePositions(positions)
    }
  }, [treeData, documents, expandedNodes, calculatePositions])

  // Drag handlers
  const handleDragStart = (nodeId, clientX, clientY) => {
    const containerRect = containerRef.current.getBoundingClientRect()
    
    // Calculate mouse position in world coordinates
    const mouseXWorld = (clientX - containerRect.left - viewport.x) / viewport.scale
    const mouseYWorld = (clientY - containerRect.top - viewport.y) / viewport.scale
    
    dragStartMousePos.current = { x: mouseXWorld, y: mouseYWorld }

    // Capture initial positions of the dragged node and all its descendants
    const descendants = getAllDescendants(nodeId)
    const nodesToMove = [nodeId, ...Array.from(descendants)]
    const initialPositions = {}
    
    nodesToMove.forEach(id => {
      initialPositions[id] = customPositions[id] || nodePositions[id] || { x: 0, y: 0 }
    })
    dragInitialPositions.current = initialPositions

    setDraggingNodeId(nodeId)
  }

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x
      const dy = e.clientY - lastMousePos.y
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else if (draggingNodeId && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const mouseXWorld = (e.clientX - containerRect.left - viewport.x) / viewport.scale
      const mouseYWorld = (e.clientY - containerRect.top - viewport.y) / viewport.scale

      const deltaX = mouseXWorld - dragStartMousePos.current.x
      const deltaY = mouseYWorld - dragStartMousePos.current.y

      const newPositions = { ...customPositions }
      
      Object.entries(dragInitialPositions.current).forEach(([id, startPos]) => {
        newPositions[id] = {
          x: startPos.x + deltaX,
          y: startPos.y + deltaY
        }
      })

      setCustomPositions(newPositions)
    }
  }

  const handleDragEnd = () => {
    setDraggingNodeId(null)
    setIsPanning(false)
  }

  const handleMouseDown = (e) => {
    // Start panning if clicking on background
    if (e.target === containerRef.current || e.target.closest('svg')) {
      setSelectedNodeId(null)
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = 1.05
    const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor
    const newScale = Math.min(Math.max(0.1, viewport.scale * direction), 5)
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - containerRect.left
    const mouseY = e.clientY - containerRect.top
    
    const newX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale)
    const newY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale)
    
    setViewport({ x: newX, y: newY, scale: newScale })
  }

  const handleResetView = useCallback(() => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const positions = { ...nodePositions, ...customPositions }
    const nodeIds = Object.keys(positions)

    // If no nodes, just center in container
    if (nodeIds.length === 0) {
      setViewport({ x: containerRect.width / 2, y: 100, scale: 1 })
      return
    }

    // Calculate bounding box of the tree
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    
    nodeIds.forEach(id => {
      const pos = positions[id]
      minX = Math.min(minX, pos.x)
      maxX = Math.max(maxX, pos.x)
      minY = Math.min(minY, pos.y)
      maxY = Math.max(maxY, pos.y)
    })

    // Add padding/margins for node dimensions (approx 260px wide, 150px tall)
    const padding = 40
    minX -= 130 + padding
    maxX += 130 + padding
    minY -= 50 + padding
    maxY += 150 + padding

    const treeWidth = maxX - minX
    const treeHeight = maxY - minY

    // Calculate scale to fit container
    const scaleX = containerRect.width / treeWidth
    const scaleY = containerRect.height / treeHeight
    const fitScale = Math.min(Math.min(scaleX, scaleY), 1) // Cap at 1.0 to prevent huge nodes on empty screens

    // Calculate center of the tree in world coordinates
    const treeCenterX = (minX + maxX) / 2
    const treeCenterY = (minY + maxY) / 2

    // Calculate viewport translation to center the tree
    // Screen Center = (World Center * Scale) + Viewport Translation
    // Viewport Translation = Screen Center - (World Center * Scale)
    const newX = (containerRect.width / 2) - (treeCenterX * fitScale)
    const newY = (containerRect.height / 2) - (treeCenterY * fitScale)

    setViewport({ 
      x: newX, 
      y: newY, 
      scale: Math.max(0.1, fitScale) 
    })
  }, [nodePositions, customPositions])

  const handleResetLayout = () => {
    setCustomPositions({})
    handleResetView()
  }

  const handleToggle = (nodeId) => {
    setCustomPositions({})
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        // Collapse this node and all its descendants
        const descendants = getAllDescendants(nodeId)
        newSet.delete(nodeId)
        descendants.forEach(id => newSet.delete(id))
      } else {
        // Expand this node and all its children
        newSet.add(nodeId)
        const descendants = getAllDescendants(nodeId)
        descendants.forEach(id => newSet.add(id))
      }
      return newSet
    })
  }

  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', handleResetView)
    return () => window.removeEventListener('resize', handleResetView)
  }, [handleResetView])

  // Initial fit to screen when nodes are loaded
  useEffect(() => {
    if (Object.keys(nodePositions).length > 0 && !hasInitializedView.current) {
      handleResetView()
      hasInitializedView.current = true
    }
  }, [nodePositions, handleResetView])

  // Enhanced toggle that expands all children when expanding a parent
  const handleParentToggle = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        // Collapse this node and all its descendants
        const descendants = getAllDescendants(nodeId)
        newSet.delete(nodeId)
        descendants.forEach(id => newSet.delete(id))
      } else {
        // Expand this node and all its children
        newSet.add(nodeId)
        const descendants = getAllDescendants(nodeId)
        descendants.forEach(id => newSet.add(id))
      }
      return newSet
    })
  }

  // Flatten tree for rendering
  const flattenTree = (nodes, level = 0) => {
    const result = []
    nodes.forEach(node => {
      result.push({ ...node, level })
      if (expandedNodes.has(node.id) && node.children) {
        result.push(...flattenTree(node.children, level + 1))
      }
    })
    return result
  }

  const flatNodes = flattenTree(treeData)

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
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-50 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onWheel={handleWheel}
    >
      {/* Dot Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: `${20 * viewport.scale}px ${20 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`
        }}
      />

      <div style={{ 
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`, 
        transformOrigin: '0 0', 
        width: '100%', 
        height: '100%',
        position: 'absolute'
      }}>
        {/* SVG Connections Layer */}
        <FlowchartConnections connections={connections} isDragging={!!draggingNodeId} />

        {/* Flowchart Nodes */}
        {flatNodes.map(node => (
          <FlowchartNode
            key={node.id}
            document={node}
            position={customPositions[node.id] || nodePositions[node.id] || { x: 0, y: 0 }}
            onEdit={() => {}}
            onDelete={onDelete}
            onToggle={handleToggle}
            onDragStart={handleDragStart}
            isDragging={draggingNodeId === node.id || (draggingNodeId && dragInitialPositions.current && !!dragInitialPositions.current[node.id])}
            isSelected={selectedNodeId === node.id}
            onNodeClick={setSelectedNodeId}
            isExpanded={expandedNodes.has(node.id)}
            hasChildren={node.children && node.children.length > 0}
            level={node.level}
            currentPath={location.pathname}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
        <button onClick={() => setViewport(v => ({ ...v, scale: Math.min(v.scale * 1.2, 5) }))} className="p-2 hover:bg-gray-50 border-b border-gray-100 text-gray-600" title="Zoom In"><Plus className="w-4 h-4" /></button>
        <button onClick={() => setViewport(v => ({ ...v, scale: Math.max(v.scale / 1.2, 0.1) }))} className="p-2 hover:bg-gray-50 border-b border-gray-100 text-gray-600" title="Zoom Out"><Minus className="w-4 h-4" /></button>
        <button onClick={handleResetLayout} className="p-2 hover:bg-gray-50 border-b border-gray-100 text-gray-600" title="Reset Layout"><RotateCcw className="w-4 h-4" /></button>
        <button onClick={handleResetView} className="p-2 hover:bg-gray-50 text-gray-600" title="Reset View"><Maximize className="w-4 h-4" /></button>
      </div>

      {/* Empty state for no visible nodes */}
      {flatNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-300" />
            <p className="mt-4 text-gray-500">No documents to display</p>
          </div>
        </div>
      )}

    </div>
  )
}

export default DocumentTreeView
