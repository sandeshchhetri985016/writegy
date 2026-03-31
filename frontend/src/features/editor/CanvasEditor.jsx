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
  readOnly = false
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
    <div className="w-full h-full flex justify-center bg-slate-100 overflow-hidden py-6 px-2 sm:px-4">
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

                  return {
                    id: assetId || `asset:${Math.random().toString(36).slice(2)}`,
                    type: 'image',
                    typeName: 'asset',
                    props: {
                      name: file.name,
                      src: publicUrl,
                      w: img.width,
                      h: img.height,
                      mimeType: file.type,
                      isAnimated: file.type === 'image/gif'
                    }
                  }
                } catch (error) {
                  toast.error('Failed to upload image', { id: toastId })
                  throw error
                }
              })

              if (onSave) {
                editor.store.listen(() => {
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
                  saveTimeoutRef.current = setTimeout(() => {
                    const snapshot = editor.getSnapshot()
                    onSave(JSON.stringify(snapshot))
                  }, 2000)
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