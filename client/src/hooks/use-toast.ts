import { useState, useCallback } from "react"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([])

  const toast = useCallback((props: ToastProps) => {
    const id = ++toastId
    const newToast = { ...props, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)

    return {
      id,
      dismiss: () => setToasts(prev => prev.filter(t => t.id !== id))
    }
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id.toString() !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss
  }
}

export function toast(props: ToastProps) {
  // Simple console logging for now
  console.log('Toast:', props.title, props.description)
}
