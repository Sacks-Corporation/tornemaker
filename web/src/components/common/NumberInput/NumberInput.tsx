import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id' | 'type'> {
  label: string
  error?: string
  id?: string
}

// Input numérico con label y mensaje de error. Mismo lenguaje visual que
// TextInput (borde naranja al focus), pero fijado a `type="number"` y sin
// las flechas nativas del navegador (ocultas vía Tailwind), pensado para
// cantidades libres validadas por el container (cantidad de equipos, tope de
// equipos por grupo, etc).
function NumberInput({ label, error, id, className = '', disabled, ...rest }: NumberInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-text-muted">
        {label}
      </label>

      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={[
          'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text transition-colors duration-150',
          'placeholder:text-text-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          error ? 'border-red-500' : 'border-border hover:border-primary',
          disabled ? 'cursor-not-allowed opacity-50' : '',
          className,
        ].join(' ')}
        {...rest}
      />

      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default NumberInput
