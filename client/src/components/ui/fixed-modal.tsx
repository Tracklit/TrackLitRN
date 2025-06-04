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
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const modalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      // Prevent all touch events on the overlay from propagating
      const overlay = overlayRef.current
      if (overlay) {
        const preventTouch = (e: TouchEvent) => {
          if (e.target === overlay) {
            e.preventDefault()
            e.stopPropagation()
          }
        }
        
        overlay.addEventListener('touchstart', preventTouch, { passive: false })
        overlay.addEventListener('touchmove', preventTouch, { passive: false })
        overlay.addEventListener('touchend', preventTouch, { passive: false })
        
        return () => {
          overlay.removeEventListener('touchstart', preventTouch)
          overlay.removeEventListener('touchmove', preventTouch)
          overlay.removeEventListener('touchend', preventTouch)
        }
      }
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6",
          className
        )}
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '32rem',
          padding: '24px',
          transform: 'none',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {children}
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