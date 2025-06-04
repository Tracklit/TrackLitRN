import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FixedModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  title?: string
}

export function FixedModal({ isOpen, onClose, children, className, title }: FixedModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative bg-white border border-gray-200 rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto",
        "dark:bg-gray-900 dark:border-gray-700",
        className
      )}>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl leading-none ml-auto"
            >
              ×
            </button>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}

export function FixedModalHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  )
}

export function FixedModalTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}

export function FixedModalDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

export function FixedModalContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}

export function FixedModalFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("mt-6 flex justify-end gap-2", className)}>
      {children}
    </div>
  )
}