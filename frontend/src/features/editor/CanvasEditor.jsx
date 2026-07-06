import { useRef, useEffect, forwardRef, useImperativeHandle, useMemo, memo } from 'react'
import { Tldraw, loadSnapshot, useEditor, useValue } from 'tldraw'
import { Book } from 'lucide-react'
import 'tldraw/tldraw.css'
import { uploadCanvasAsset } from '../../lib/storage'
import toast from 'react-hot-toast'
import './canvas-theme.css'

// NotebookBackground: Reactive CSS background that pans with camera Y
const NotebookBackground = () => {
  const editor = useEditor()
  const camera = useValue('camera', () => editor?.getCamera(), [editor])

  // CRITICAL FIX: Prevent render crash before camera initializes
  if (!camera) return null;
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
  const hasLoadedInitialDataRef = useRef(false)
  const tldrawComponents = useMemo(() => ({
    Background: NotebookBackground,
    PageMenu: null,
    NavigationZone: null,
    Minimap: null,
    HelperButtons: null
  }), [])

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    getSnapshot: () => editorRef.current?.getSnapshot() || null,
  }))

  useEffect(() => {
    if (!editorRef.current || hasLoadedInitialDataRef.current) return

    if (initialData && initialData !== 'null' && initialData !== '""') {
      try {
        const snapshot = typeof initialData === 'string' ? JSON.parse(initialData) : initialData
        if (snapshot && typeof snapshot === 'object') {
          loadSnapshot(editorRef.current.store, snapshot)
          hasLoadedInitialDataRef.current = true
        }
      } catch (error) {
        console.warn('Failed to load initial canvas data:', error)
      }
    }
  }, [initialData])

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
            components={tldrawComponents}
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

              // === CRITICAL FIX: Safe Unified Store Listener ===
              editor.store.listen((entry) => {
                const camera = editor.getCamera()

                // 1. BOUNDARY CONSTRAINTS
                if (camera) {
                  const TOP_LIMIT = 0;
                  const BOTTOM_LIMIT = -56550;
                  let targetY = camera.y;

                  if (targetY > TOP_LIMIT) targetY = TOP_LIMIT;
                  if (targetY < BOTTOM_LIMIT) targetY = BOTTOM_LIMIT;

                  if (Math.abs(camera.x) > 0.1 || camera.z !== 1 || Math.abs(camera.y - targetY) > 0.1) {
                    editor.setCamera({ x: 0, y: targetY, z: 1 })
                  }
                }

                // 2. IMAGE RESIZING (Added shapes)
                if (entry.changes.added) {
                  Object.values(entry.changes.added).forEach(shape => {
                    if (shape.type === 'image') {
                      const MAX_WIDTH = 600;
                      const originalWidth = shape.props?.w || shape.w;

                      if (originalWidth > MAX_WIDTH) {
                        const scale = MAX_WIDTH / originalWidth;
                        setTimeout(() => {
                          const currentShape = editor.getShape(shape.id);
                          if (currentShape) {
                            editor.updateShape({
                              id: shape.id,
                              type: 'image',
                              props: { ...currentShape.props, w: MAX_WIDTH, h: (shape.props?.h || shape.h) * scale }
                            })
                          }
                        }, 0)
                      }
                    }
                  })
                }

                // 3. SHAPE BOUNDARIES (Updated shapes)
                if (entry.changes.updated) {
                  const BOUNDS = { x: 0, y: 0, w: 800, h: 56550 }
                  Object.values(entry.changes.updated).forEach(updateTuple => {
                    const shape = updateTuple[1]

                    if (shape && (shape.type === 'image' || shape.type === 'text' || shape.type === 'draw')) {
                      let newX = shape.x
                      let newY = shape.y
                      let needsUpdate = false

                      if (newX < BOUNDS.x) { newX = BOUNDS.x; needsUpdate = true }
                      if (newY < BOUNDS.y) { newY = BOUNDS.y; needsUpdate = true }

                      const w = shape.props?.w || 100;
                      const h = shape.props?.h || 100;

                      if (newX + w > BOUNDS.x + BOUNDS.w) { newX = BOUNDS.x + BOUNDS.w - w; needsUpdate = true }
                      if (newY + h > BOUNDS.y + BOUNDS.h) { newY = BOUNDS.y + BOUNDS.h - h; needsUpdate = true }

                      if (needsUpdate) {
                        setTimeout(() => {
                          if (editor.getShape(shape.id)) {
                            editor.updateShape({ id: shape.id, type: shape.type, x: newX, y: newY })
                          }
                        }, 0)
                      }
                    }
                  })
                }

                // 4. AUTO-SAVE LOGIC
                if (onSave && entry.source === 'user') {
                  const hasDocumentChanges =
                    Object.keys(entry.changes.added).some(id => id.startsWith('shape:') || id.startsWith('asset:') || id.startsWith('page:')) ||
                    Object.keys(entry.changes.updated).some(id => id.startsWith('shape:') || id.startsWith('asset:') || id.startsWith('page:')) ||
                    Object.keys(entry.changes.removed).some(id => id.startsWith('shape:') || id.startsWith('asset:') || id.startsWith('page:'))

                  if (hasDocumentChanges) {
                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
                    saveTimeoutRef.current = setTimeout(() => {
                      const snapshot = editor.getSnapshot()
                      onSave(JSON.stringify(snapshot))
                    }, 2000)
                  }
                }
              })

              if (initialData && initialData !== "null" && initialData !== '""') {
                hasLoadedInitialDataRef.current = false
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
            }}
          />
        </div>
      </div>
    </div>
  )
})

CanvasEditor.displayName = 'CanvasEditor'

export default memo(CanvasEditor, (prevProps, nextProps) => (
  prevProps.readOnly === nextProps.readOnly &&
  prevProps.initialData === nextProps.initialData
))