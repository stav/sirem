import { useState, useRef, useEffect } from 'react'

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  contactDetails?: Array<{id: string, name: string}>
}

interface ToastWithId extends ToastProps {
  id: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastWithId[]>([])
  const timeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map())

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      timeouts.clear()
    }
  }, [])

  const toast = (props: ToastProps) => {
    const newToast: ToastWithId = { ...props, id: Date.now() }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after 4 seconds
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      timeoutsRef.current.delete(newToast.id)
    }, 4000)
    
    timeoutsRef.current.set(newToast.id, timeoutId)
  }

  const dismiss = (id: number) => {
    // Clear the timeout if it exists
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
    
    // Remove the toast immediately
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toast, toasts, dismiss }
}
