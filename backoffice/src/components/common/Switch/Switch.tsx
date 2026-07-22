import { useId } from 'react'

export interface SwitchProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
}

// Toggle on/off con label (y descripción opcional) a la izquierda.
function Switch({ label, description, checked, onChange, disabled, id }: SwitchProps) {
  const generatedId = useId()
  const switchId = id ?? generatedId

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
      <label
        htmlFor={switchId}
        className={[
          'flex flex-col gap-0.5',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="text-sm font-medium text-text">{label}</span>
        {description && <span className="text-xs text-text-muted">{description}</span>}
      </label>

      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-text-muted/30 transition-colors duration-150 peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/25"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 peer-checked:translate-x-5"
        />
      </span>
    </div>
  )
}

export default Switch
