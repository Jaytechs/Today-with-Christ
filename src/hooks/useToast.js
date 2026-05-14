// src/hooks/useToast.js
import { useState, useCallback } from 'react'

/**
 * useToast — minimal toast state hook.
 * Usage:
 *   const { toast, showToast } = useToast()
 *   showToast('Saved ✓')
 *   showToast('Error occurred', 'error')
 *   <Toast message={toast.message} type={toast.type} />
 */
export function useToast(duration = 3500) {
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: 'success' }), duration)
  }, [duration])

  return { toast, showToast }
}
