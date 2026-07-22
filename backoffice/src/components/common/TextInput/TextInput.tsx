import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id'> {
  label: string
  error?: string
  id?: string
  /** Habilita el toggle de mostrar/ocultar cuando `type="password"`. */
  showPasswordToggle?: boolean
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

// Input de texto con label, mensaje de error y toggle opcional de visibilidad
// para contraseñas. Borde naranja al focus.
function TextInput({
  label,
  error,
  id,
  className = '',
  type = 'text',
  showPasswordToggle = false,
  showPasswordLabel = 'Mostrar contraseña',
  hidePasswordLabel = 'Ocultar contraseña',
  disabled,
  ...rest
}: TextInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const [visible, setVisible] = useState(false)

  const isPassword = type === 'password'
  const resolvedType = isPassword && showPasswordToggle && visible ? 'text' : type

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-text-muted">
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={[
            'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text transition-colors duration-150',
            'placeholder:text-text-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary',
            error ? 'border-red-500' : 'border-border hover:border-primary',
            disabled ? 'cursor-not-allowed opacity-50' : '',
            isPassword && showPasswordToggle ? 'pr-10' : '',
            className,
          ].join(' ')}
          {...rest}
        />

        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? hidePasswordLabel : showPasswordLabel}
            title={visible ? hidePasswordLabel : showPasswordLabel}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {visible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 6c-5 0-9.27 3.11-11 7 .74 1.68 1.87 3.14 3.27 4.29l1.44-1.44A9.03 9.03 0 0 1 3.18 13c1.42-3.18 4.94-5.5 8.82-5.5 1.06 0 2.08.17 3.02.48l1.5-1.5A11.6 11.6 0 0 0 12 6Zm-.11 3a4 4 0 0 0-3.89 4c0 .47.09.91.24 1.32l1.5-1.5a2 2 0 0 1 2.06-2.06l1.5-1.5A4 4 0 0 0 11.89 9ZM3.71 3.71 2.29 5.13 5 7.84C3.24 9.11 1.85 10.86 1 13c1.73 3.89 6 7 11 7 1.9 0 3.68-.45 5.24-1.24l2.62 2.61 1.41-1.41L3.71 3.71Zm7.6 7.6 2.98 2.98a2 2 0 0 1-2.98-2.98Zm1.02-3.28 6.13 6.13c1.06-.87 1.95-1.95 2.54-3.16-1.42-3.18-4.94-5.5-8.82-5.5-.44 0-.87.03-1.29.09l1.44 1.44Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 5c-6.5 0-10 6-11 7 1 1 4.5 7 11 7s10-6 11-7c-1-1-4.5-7-11-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7A2.5 2.5 0 1 0 12 14a2.5 2.5 0 0 0 0-4.5Z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default TextInput
