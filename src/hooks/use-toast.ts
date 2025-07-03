import { useState } from 'react'

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastWithId extends ToastProps {
  id: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastWithId[]>([])

  const toast = (props: ToastProps) => {
    const newToast: ToastWithId = { ...props, id: Date.now() }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
    }, 4000)
  }

  return { toast, toasts }
}
