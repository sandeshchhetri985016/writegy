import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Tldraw, loadSnapshot, useEditor, useValue } from 'tldraw'
import { Book } from 'lucide-react'
import 'tldraw/tldraw.css'
import { uploadCanvasAsset } from '../../lib/storage'
import toast from 'react-hot-toast'
import './canvas-theme.css'

// NotebookBackground: Reactive CSS background that pans with camera Y
const NotebookBackground = () => {
  const editor = useEditor()
  const camera = useValue('camera', () => editor.getCamera(), [editor])
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        backgroundImage: `
          repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px),
          repeating-linear-gradient(to bottom, transparent, transparent 1131px, #f8fafc 1131px, #f8fafc 1163px)
        `,
        backgroundSize: '100% 32px, 100% 1163px',
        backgroundPosition: `0px ${camera.y}px, 0px ${camera.y}px`,
        backgroundColor: '#ffffff'
      }}
    >
      {/* COVER PAGE OVERLAY */}
      <div 
        className="absolute top-0 left-0 w-full bg-white border-t-[16px] border-t-brand-500 flex justify-center pt-32"
        style={{ 
          height: '1131px', 
          transform: `translateY(${camera.y}px)` 
        }}
      >
        <div className="flex items-center gap-3 opacity-[0.15] select-none">
          <Book className="w-10 h-10 text-slate-900" />
          <span className="text-3xl font-bold text-slate-900 tracking-[0.2em] uppercase">Cover Page</span>
        </div>
      </div>
    </div>
  )
}

const CanvasEditor = forwardRef(({ 
  initialData, 
  onSave, 
  readOnly = false,
  onExportReady
}, ref) => {
  const editorRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    getSnapshot: () => editorRef.current?.getSnapshot() || null,
  }))

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (editorRef.current) {
        try { editorRef.current = null } catch (error) {}
      }
    }
  }, [])

  return (
    <div className="w-full h-full flex justify-center bg-slate-100 dark:bg-slate-900 overflow-hidden py-6 px-2 sm:px-4">
      <div 
        className="relative bg-white shadow-2xl border border-slate-300 rounded-md shrink-0 overflow-hidden"
        style={{ 
          width: '100%', 
          maxWidth: '800px',
          height: '100%' 
        }}
      >
        <div className="absolute inset-0">
          <Tldraw
            components={{
              Background: NotebookBackground,
              PageMenu: null,
              NavigationZone: null,
              Minimap: null,
              HelperButtons: null
            }}
            onMount={(editor) => {
              editorRef.current = editor
              editor.setCamera({ x: 0, y: 0, z: 1 })
              editor.updateInstanceState({ isGridMode: false })
              
              if (readOnly) {
                editor.updateInstanceState({ isReadonly: true })
              }

              // === EXPORT FUNCTION ===
              // Expose canvas export function to parent component
              if (onExportReady) {
                const exportCanvasAsImage = async (format = 'png') => {
                  try {
                    // Get all shape IDs
                    const shapeIds = Array.from(editor.getCurrentPageShapeIds())
                    if (shapeIds.length === 0) {
                      toast.error('No shapes to export')
                      return null
                    }

                    // Use tldraw's native toImage method
                    // editor.toImage() returns an object with {blob, width, height}
                    const result = await editor.toImage(shapeIds, {
                      format: format,
                      background: true,
                      scale: 2
                    })

                    if (!result || !result.blob || !(result.blob instanceof Blob)) {
                      console.error('Invalid result returned:', result)
                      toast.error('Export failed')
                      return null
                    }

                    return result.blob
                  } catch (e) {
                    console.error('Export failed:', e)
                    toast.error('Export failed: ' + (e.message || 'Unknown error'))
                    return null
                  }
                }
                // Fix React state trap: wrap in closure so function isn't executed immediately
                onExportReady(() => exportCanvasAsImage)
              }

              // === THE BOUNDARY LOGIC ===
              editor.store.listen(() => {
                const camera = editor.getCamera()
                
                // Tldraw Y axis: Scrolling UP makes Y positive. Scrolling DOWN makes Y negative.
                const TOP_LIMIT = 0; // The absolute top. Cannot scroll above the cover page.
                const BOTTOM_LIMIT = -56550; // Allow scrolling down exactly 50 pages (1131 * 50). Adjust as needed.

                let targetY = camera.y;

                // Enforce the physical boundaries
                if (targetY > TOP_LIMIT) targetY = TOP_LIMIT;
                if (targetY < BOTTOM_LIMIT) targetY = BOTTOM_LIMIT;

                // Lock X, Lock Zoom, and apply clamped Y
                if (camera.x !== 0 || camera.z !== 1 || camera.y !== targetY) {
                  editor.setCamera({ x: 0, y: targetY, z: 1 })
                }
              })

              // === IMAGE AUTO-RESIZE ===
              // Automatically resize pasted images to fit within canvas bounds
              const handleCreateShapes = (entry) => {
                const shapes = entry.changes.added
                Object.keys(shapes).forEach(id => {
                  const shape = shapes[id]
                  if (shape.type === 'image') {
                    // Telemetry: Log shape structure for debugging
                    console.log('Intercepted Shape:', shape)
                    
                    const MAX_WIDTH = 600
                    const originalWidth = shape.props?.w || shape.w
                    const originalHeight = shape.props?.h || shape.h
                    
                    if (originalWidth > MAX_WIDTH) {
                      const scale = MAX_WIDTH / originalWidth
                      const newHeight = originalHeight * scale
                      
                      console.log(`Resizing image: ${originalWidth}x${originalHeight} -> ${MAX_WIDTH}x${newHeight}`)
                      
                      editor.updateShapes([{
                        id: shape.id,
                        type: 'image',
                        props: {
                          w: MAX_WIDTH,
                          h: newHeight
                        }
                      }])
                    }
                  }
                })
              }

              // === BOUNDARY CONSTRAINT ===
              // Constrain shapes to visible canvas area
              const BOUNDS = { x: 0, y: 0, w: 800, h: 1131 }
              const handleChangeShapes = (entry) => {
                const shapes = entry.changes.updated
                Object.keys(shapes).forEach(id => {
                  const shape = shapes[id]
                  if (shape.type === 'image' || shape.type === 'text' || shape.type === 'draw') {
                    const { x, y, w, h } = shape
                    let newX = x
                    let newY = y
                    let needsUpdate = false

                    // Check if shape exceeds left boundary
                    if (x < BOUNDS.x) {
                      newX = BOUNDS.x
                      needsUpdate = true
                    }
                    // Check if shape exceeds top boundary
                    if (y < BOUNDS.y) {
                      newY = BOUNDS.y
                      needsUpdate = true
                    }
                    // Check if shape exceeds right boundary
                    if (x + w > BOUNDS.x + BOUNDS.w) {
                      newX = BOUNDS.x + BOUNDS.w - w
                      needsUpdate = true
                    }
                    // Check if shape exceeds bottom boundary
                    if (y + h > BOUNDS.y + BOUNDS.h) {
                      newY = BOUNDS.y + BOUNDS.h - h
                      needsUpdate = true
                    }

                    // Only update if shape actually exceeds bounds (performance guard)
                    if (needsUpdate) {
                      editor.updateShape({
                        id: shape.id,
                        type: shape.type,
                        x: newX,
                        y: newY
                      })
                    }
                  }
                })
              }

              editor.on('create-shapes', handleCreateShapes)
              editor.on('change-shapes', handleChangeShapes)
              
              if (initialData) {
                try {
                  const snapshot = JSON.parse(initialData)
                  loadSnapshot(editor.store, snapshot)
                } catch (error) {
                  console.warn('Failed to load initial canvas data:', error)
                }
              }
              
              editor.registerExternalAssetHandler('file', async ({ file, assetId }) => {
                const toastId = toast.loading('Uploading image...')
                try {
                  const publicUrl = await uploadCanvasAsset(file)
                  const img = new Image()
                  img.src = URL.createObjectURL(file)
                  await new Promise(resolve => img.onload = resolve)

                  toast.success('Image uploaded successfully', { id: toastId })

                  // Auto-resize image to max 600px width
                  const MAX_WIDTH = 600
                  let finalWidth = img.width
                  let finalHeight = img.height
                  
                  if (img.width > MAX_WIDTH) {
                    const scale = MAX_WIDTH / img.width
                    finalWidth = MAX_WIDTH
                    finalHeight = img.height * scale
                    console.log(`Auto-resizing image: ${img.width}x${img.height} -> ${finalWidth}x${finalHeight}`)
                  }

                  return {
                    id: assetId || `asset:${Math.random().toString(36).slice(2)}`,
                    type: 'image',
                    typeName: 'asset',
                    props: {
                      name: file.name,
                      src: publicUrl,
                      w: finalWidth,
                      h: finalHeight,
                      mimeType: file.type,
                      isAnimated: file.type === 'image/gif'
                    }
                  }
                } catch (error) {
                  toast.error('Failed to upload image', { id: toastId })
                  throw error
                }
              })

              // === HANDLE IMAGE RESIZE ON SHAPE CREATION ===
              // This catches images added via paste (which may bypass registerExternalAssetHandler)
              const handleStoreChange = (entry) => {
                const addedShapes = entry.changes.added
                
                Object.keys(addedShapes).forEach(id => {
                  if (id.startsWith('shape:')) {
                    const shape = addedShapes[id]
                    
                    if (shape.type === 'image') {
                      console.log('Intercepted Shape:', shape)
                      
                      const MAX_WIDTH = 600
                      const originalWidth = shape.props?.w || shape.w
                      const originalHeight = shape.props?.h || shape.h
                      
                      // Calculate reposition to center image in visible area
                      let newX = shape.x
                      let newY = shape.y
                      
                      // Get the center of the visible viewport
                      const camera = editor.getCamera()
                      const viewport = editor.getViewportScreenBounds()
                      const centerX = -camera.x + viewport.w / 2
                      const centerY = -camera.y + viewport.h / 2
                      
                      // If image is outside visible area, reposition to center
                      if (shape.x < -100 || shape.x > 600 || shape.y < -100 || shape.y > 800) {
                        // Center the image in the visible area
                        newX = centerX - (originalWidth / 2)
                        newY = centerY - (originalHeight / 2)
                        console.log(`Repositioning image from (${shape.x}, ${shape.y}) to (${newX}, ${newY}) - center of viewport`)
                      }
                      
                      if (originalWidth && originalWidth > MAX_WIDTH) {
                        const scale = MAX_WIDTH / originalWidth
                        const newHeight = originalHeight * scale
                        
                        console.log(`Resizing image: ${originalWidth}x${originalHeight} -> ${MAX_WIDTH}x${newHeight}`)
                        
                        // Use setTimeout to ensure shape is fully created before updating
                        setTimeout(() => {
                          // Get current shape to preserve all props
                          const currentShape = editor.getShape(shape.id)
                          if (currentShape) {
                            console.log('Current shape props:', currentShape.props)
                            editor.updateShapes([{
                              id: shape.id,
                              type: 'image',
                              x: newX,
                              y: newY,
                              props: {
                                ...currentShape.props,
                                w: MAX_WIDTH,
                                h: newHeight
                              }
                            }])
                          }
                        }, 0)
                      } else if (newX !== shape.x || newY !== shape.y) {
                        // Just reposition if no resize needed
                        setTimeout(() => {
                          editor.updateShapes([{
                            id: shape.id,
                            type: 'image',
                            x: newX,
                            y: newY
                          }])
                        }, 0)
                      }
                    }
                  }
                })
              }
              
              editor.store.listen(handleStoreChange)

              if (onSave) {
                editor.store.listen((entry) => {
                  // ONLY save if the user actually changed a shape, asset, or page.
                  // Ignore camera movements, pointer changes, and presence data.
                  const hasDocumentChanges =
                    Object.keys(entry.changes.added).some(id => id.startsWith('shape:') || id.startsWith('asset:') || id.startsWith('page:')) ||
                    Object.keys(entry.changes.updated).some(id => id.startsWith('shape:') || id.startsWith('asset:') || id.startsWith('page:')) ||
                    Object.keys(entry.changes.removed).some(id => id.startsWith('shape:') || id.startsWith('asset:') || id.startsWith('page:'))

                  if (hasDocumentChanges && entry.source === 'user') {
                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
                    saveTimeoutRef.current = setTimeout(() => {
                      const snapshot = editor.getSnapshot()
                      onSave(JSON.stringify(snapshot))
                    }, 2000)
                  }
                })
              }
            }}
          />
        </div>
      </div>
    </div>
  )
})

CanvasEditor.displayName = 'CanvasEditor'

export default CanvasEditor