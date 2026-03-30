import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Tldraw, loadSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'
import { uploadCanvasAsset } from '../../lib/storage'
import toast from 'react-hot-toast'
import './canvas-theme.css' // Our custom CSS variables

const components = {
  HelpMenu: null,
}

const CanvasEditor = forwardRef(({ 
  initialData, 
  onSave, 
  readOnly = false,
  className = ''
}, ref) => {
  const editorRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    getSnapshot: () => editorRef.current?.getSnapshot() || null,
  }))

  const handleMount = (editor) => {
    editorRef.current = editor
    setIsReady(true)

    // 1. Load Initial Data
    if (initialData) {
      try {
        const snapshot = JSON.parse(initialData)
        // tldraw v4 way: use the imported function and pass the store
        loadSnapshot(editor.store, snapshot)
      } catch (error) {
        console.warn('Failed to load initial canvas data:', error)
      }
    }

    // 2. Set Read-Only
    if (readOnly) {
      editor.updateInstanceState({ isReadonly: true })
    }

    // 3. THIS IS THE V4 WAY TO INTERCEPT IMAGE UPLOADS
    editor.registerExternalAssetHandler('file', async ({ file, assetId }) => {
      const toastId = toast.loading('Uploading image...')
      try {
        // Upload to Supabase Storage
        const publicUrl = await uploadCanvasAsset(file)
        
        // Get dimensions for tldraw rendering
        const img = new Image()
        img.src = URL.createObjectURL(file)
        await new Promise(resolve => img.onload = resolve)

        toast.success('Image uploaded successfully', { id: toastId })

        // Return the required v4 Asset Record
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
        console.error('Failed to upload image:', error)
        toast.error('Failed to upload image', { id: toastId })
        throw error
      }
    })

    // 4. Auto-save
    if (onSave) {
      let saveTimeout = null
      editor.store.listen(() => {
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          const snapshot = editor.getSnapshot()
          onSave(JSON.stringify(snapshot))
        }, 2000)
      })
    }
  }

  const containerRef = useRef(null)

  return (
    <div 
      ref={containerRef}
      className={`h-full w-full tldraw-wrapper ${className}`} 
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <Tldraw
        onMount={handleMount}
        components={components}
      />
    </div>
  )
})

CanvasEditor.displayName = 'CanvasEditor'

export default CanvasEditor