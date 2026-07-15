import { useEffect } from 'react'
import { MdClose } from 'react-icons/md'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-navy-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] animate-scale-in overflow-hidden rounded-2xl bg-white shadow-2xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="btn-icon text-navy-400 hover:bg-navy-50 hover:text-navy-700"
            aria-label="Close modal"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-64px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
