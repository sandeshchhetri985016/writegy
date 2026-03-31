import { useEffect, useRef } from 'react'

/**
 * Custom hook for auto-saving with debounce
 * @param {Function} onSave - The save function to call
 * @param {Object} data - The data to save (content, title, canvasData, etc.)
 * @param {number} delay - Debounce delay in milliseconds (default: 2000)
 * @param {boolean} enabled - Whether auto-save is enabled (default: true)
 * @returns {Object} - { saveTimeoutRef } for cleanup if needed
 */
export const useAutoSave = (onSave, data, delay = 2000, enabled = true) => {
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    // Don't auto-save if disabled or no save function
    if (!enabled || !onSave) return

    // Don't save if there's no content
    const hasContent = data?.content?.trim() || data?.title?.trim() || data?.canvasData
    if (!hasContent) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      onSave(data)
    }, delay)

    // Cleanup on unmount or dependency change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [onSave, data, delay, enabled])

  return { saveTimeoutRef }
}

export default useAutoSave