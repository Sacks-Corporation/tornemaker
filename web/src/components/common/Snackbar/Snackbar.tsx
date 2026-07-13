import { useEffect } from 'react'
import type { SnackbarVariant } from '../../../types/common.types'

export interface SnackbarProps {
  message: string | null
  variant?: SnackbarVariant
  closeLabel: string
  autoHideMs?: number
  onClose: () => void
}

const variantClasses: Record<SnackbarVariant, string> = {
  success: 'border-primary bg-primary text-on-primary',
  error: 'border-red-700 bg-red-600 text-white',
}

// Notificación flotante inferior, se autodescarta pasado `autoHideMs`. Se usa
// para confirmar/informar el resultado de acciones de escritura (ej. carga de
// resultado de un partido).
function Snackbar({ message, variant = 'success', closeLabel, autoHideMs = 5000, onClose }: SnackbarProps) {
  useEffect(() => {
    if (!message) return undefined

    const timer = window.setTimeout(onClose, autoHideMs)
    return () => window.clearTimeout(timer)
  }, [message, autoHideMs, onClose])

  if (!message) return null

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={[
          'flex max-w-xl items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg',
          variantClasses[variant],
        ].join(' ')}
      >
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Snackbar
