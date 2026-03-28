import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import CanvasToolbar from './CanvasToolbar'
import CanvasStylePanel from './CanvasStylePanel'
import CanvasSearch from './CanvasSearch'
import toast from 'react-hot-toast'

// Custom styles for tldraw to match Writegy design
const tldrawStyles = `
  .tl-container {
    background-color: transparent !important;
  }
  .tlui-menu-zone {
    display: none !important;
  }
  .tlui-page-menu-zone {
    display: none !important;
  }
  .tlui-navigation-zone {
    display: none !important;
  }
  .tlui-help-menu {
    display: none !important;
  }
  .tlui-toolbar {
    display: none !important;
  }
`

const CanvasEditor = forwardRef(({ 
  initialData, 
  onSave, 
  readOnly = false,
  className = ''
}, ref) => {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  
  // Toolbar state
  const [activeTool, setActiveTool] = useState('select')
  const [selectedColor, setSelectedColor] = useState('black')
  const [selectedSize, setSelectedSize] = useState('m')
  const [isReadOnly, setIsReadOnly] = useState(readOnly)
  
  // Style panel state
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [selectedDash, setSelectedDash] = useState('draw')
  const [selectedFill, setSelectedFill] = useState('none')
  const [selectedOpacity, setSelectedOpacity] = useState(1)
  
  // Search panel state
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentResultIndex, setCurrentResultIndex] = useState(0)

  // Handle image upload
  const handleImageUpload = () => {
    if (!editorRef.current || isReadOnly) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      try {
        // Create a URL for the uploaded image
        const url = URL.createObjectURL(file)
        
        // Get center of viewport
        const viewportCenter = editorRef.current.getViewportScreenCenter()
        const pagePoint = editorRef.current.screenToPage(viewportCenter)
        
        // Create asset using tldraw v2 API
        const assetId = await editorRef.current.createAssets([{
          type: 'image',
          typeName: 'asset',
          props: {
            name: file.name,
            src: url,
            w: 200,
            h: 200,
            mimeType: file.type,
            isAnimated: false
          }
        }])
        
        // createAssets returns an array of asset IDs
        const createdAssetId = Array.isArray(assetId) ? assetId[0] : assetId
        
        // Create image shape with assetId
        editorRef.current.createShapes([{
          type: 'image',
          x: pagePoint.x - 100,
          y: pagePoint.y - 100,
          props: {
            assetId: createdAssetId,
            w: 200,
            h: 200
          }
        }])
        
        toast.success('Image uploaded successfully')
      } catch (error) {
        console.error('Failed to upload image:', error)
        toast.error('Failed to upload image')
      }
    }
    input.click()
  }

  // Handle search
  const handleSearch = () => {
    setShowSearchPanel(!showSearchPanel)
    if (!showSearchPanel) {
      setSearchQuery('')
      setSearchResults([])
      setCurrentResultIndex(0)
    }
  }

  // Search in canvas shapes
  const performSearch = (query) => {
    if (!editorRef.current || !query.trim()) {
      setSearchResults([])
      return
    }
    
    const shapes = editorRef.current.getCurrentPageShapes()
    const results = shapes.filter(shape => {
      // Search in text shapes
      if (shape.type === 'text' && shape.props.text) {
        return shape.props.text.toLowerCase().includes(query.toLowerCase())
      }
      // Search in note shapes
      if (shape.type === 'note' && shape.props.text) {
        return shape.props.text.toLowerCase().includes(query.toLowerCase())
      }
      return false
    })
    
    setSearchResults(results)
    setCurrentResultIndex(0)
    
    if (results.length > 0) {
      // Select and zoom to first result
      editorRef.current.select(results[0].id)
      editorRef.current.zoomToSelection()
    }
  }

  // Navigate to next search result
  const handleNextResult = () => {
    if (searchResults.length === 0) return
    
    const nextIndex = (currentResultIndex + 1) % searchResults.length
    setCurrentResultIndex(nextIndex)
    editorRef.current.select(searchResults[nextIndex].id)
    editorRef.current.zoomToSelection()
  }

  // Navigate to previous search result
  const handlePrevResult = () => {
    if (searchResults.length === 0) return
    
    const prevIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1
    setCurrentResultIndex(prevIndex)
    editorRef.current.select(searchResults[prevIndex].id)
    editorRef.current.zoomToSelection()
  }

  // Handle export as PNG
  const handleExport = async () => {
    if (!editorRef.current) return
    
    try {
      toast.loading('Exporting canvas...', { id: 'export' })
      
      // Get all shape IDs on current page (tldraw v2 API)
      const shapeIds = editorRef.current.getCurrentPageShapeIds()
      
      // Check if canvas is empty
      if (shapeIds.length === 0) {
        toast.error('Canvas is empty - nothing to export', { id: 'export' })
        return
      }
      
      const blob = await editorRef.current.toImage([...shapeIds], {
        type: 'png',
        quality: 1,
        background: true
      })
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `canvas-export-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Canvas exported successfully', { id: 'export' })
    } catch (error) {
      console.error('Failed to export canvas:', error)
      toast.error('Failed to export canvas', { id: 'export' })
    }
  }

  // Inject custom styles
  useEffect(() => {
    if (typeof document !== 'undefined' && document.head) {
      const style = document.createElement('style')
      style.textContent = tldrawStyles
      document.head.appendChild(style)
      return () => {
        if (document.head && document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    }
  }, [])

  // Show style panel when shapes are selected
  useEffect(() => {
    if (!editorRef.current) return

    const handleSelectionChange = () => {
      const selectedShapes = editorRef.current.getSelectedShapes()
      if (selectedShapes.length > 0) {
        setShowStylePanel(true)
      }
    }

    editorRef.current.on('selectionchange', handleSelectionChange)

    return () => {
      if (editorRef.current) {
        editorRef.current.off('selectionchange', handleSelectionChange)
      }
    }
  }, [isReady])

  // Expose editor methods to parent component
  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    getSnapshot: () => {
      if (editorRef.current) {
        return editorRef.current.getSnapshot()
      }
      return null
    },
    loadSnapshot: (snapshot) => {
      if (editorRef.current && snapshot) {
        editorRef.current.loadSnapshot(snapshot)
      }
    },
    // Tool methods
    setCurrentTool: (tool) => {
      if (editorRef.current) {
        editorRef.current.setCurrentTool(tool)
      }
    },
    // Page methods
    getPages: () => {
      if (editorRef.current) {
        return editorRef.current.getPages()
      }
      return []
    },
    getCurrentPageId: () => {
      if (editorRef.current) {
        return editorRef.current.getCurrentPageId()
      }
      return null
    },
    setCurrentPage: (pageId) => {
      if (editorRef.current) {
        editorRef.current.setCurrentPage(pageId)
      }
    },
    createPage: (options) => {
      if (editorRef.current) {
        return editorRef.current.createPage(options)
      }
      return null
    },
    deletePage: (pageId) => {
      if (editorRef.current) {
        editorRef.current.deletePage(pageId)
      }
    },
    // Shape methods
    getCurrentPageShapes: () => {
      if (editorRef.current) {
        return editorRef.current.getCurrentPageShapes()
      }
      return []
    },
    createShapes: (shapes) => {
      if (editorRef.current) {
        editorRef.current.createShapes(shapes)
      }
    },
    // Style methods
    setStyleForNextShapes: (style, value) => {
      if (editorRef.current) {
        editorRef.current.setStyleForNextShapes(style, value)
      }
    },
    // Selection methods
    select: (...shapeIds) => {
      if (editorRef.current) {
        editorRef.current.select(...shapeIds)
      }
    },
    zoomToSelection: () => {
      if (editorRef.current) {
        editorRef.current.zoomToSelection()
      }
    },
    // Export methods
    toImage: async (pageId, options) => {
      if (editorRef.current) {
        return await editorRef.current.toImage(pageId, options)
      }
      return null
    }
  }))

  const handleMount = (editor) => {
    editorRef.current = editor
    setIsReady(true)

    // Load initial data if provided
    if (initialData) {
      try {
        const snapshot = JSON.parse(initialData)
        editor.store.loadSnapshot(snapshot)
      } catch (error) {
        console.warn('Failed to load initial canvas data:', error)
      }
    }

    // Set read-only mode
    if (readOnly) {
      editor.updateInstanceState({ isReadonly: true })
    }

    // Set up auto-save listener
    if (onSave) {
      let saveTimeout = null
      editor.store.listen(() => {
        // Debounce saves (2 seconds like text editor)
        if (saveTimeout) {
          clearTimeout(saveTimeout)
        }
        saveTimeout = setTimeout(() => {
          const snapshot = editor.getSnapshot()
          onSave(JSON.stringify(snapshot))
        }, 2000)
      })
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`h-full w-full ${className}`}
      style={{ 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Tldraw
        hideUi={true}
        onMount={handleMount}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-slate-500 dark:text-slate-400">
            Loading canvas...
          </div>
        </div>
      )}
      
      {/* Custom Toolbar */}
      {isReady && (
        <CanvasToolbar
          editor={editorRef.current}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          isReadOnly={isReadOnly}
          setIsReadOnly={setIsReadOnly}
          onShowStylePanel={() => setShowStylePanel(true)}
          onImageUpload={handleImageUpload}
          onSearch={handleSearch}
          onExport={handleExport}
        />
      )}
      
      {/* Floating Style Panel */}
      {isReady && showStylePanel && (
        <CanvasStylePanel
          editor={editorRef.current}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          selectedDash={selectedDash}
          setSelectedDash={setSelectedDash}
          selectedFill={selectedFill}
          setSelectedFill={setSelectedFill}
          selectedOpacity={selectedOpacity}
          setSelectedOpacity={setSelectedOpacity}
          isReadOnly={isReadOnly}
          onClose={() => setShowStylePanel(false)}
          position={{ x: window.innerWidth - 300, y: 100 }}
        />
      )}
      
      {/* Search Panel */}
      {isReady && (
        <CanvasSearch
          isOpen={showSearchPanel}
          onClose={() => setShowSearchPanel(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          currentResultIndex={currentResultIndex}
          onSearch={performSearch}
          onNextResult={handleNextResult}
          onPrevResult={handlePrevResult}
        />
      )}
    </div>
  )
})

CanvasEditor.displayName = 'CanvasEditor'

export default CanvasEditor