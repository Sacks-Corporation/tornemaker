import type { InputHTMLAttributes } from 'react'

export interface RadioButtonProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string
}

function RadioButton({ label, className = '', id, disabled, ...rest }: RadioButtonProps) {
  return (
    <label
      htmlFor={id}
      className={[
        'inline-flex items-center gap-2 text-sm text-text',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="radio"
          id={id}
          disabled={disabled}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full"
          {...rest}
        />
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none absolute inset-0 rounded-full border-2 border-border',
            'transition-shadow duration-150',
            'peer-focus-visible:ring-4 peer-focus-visible:ring-primary/25',
            'peer-hover:ring-4 peer-hover:ring-primary/10',
          ].join(' ')}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-2.5 w-2.5 scale-0 rounded-full bg-primary transition-transform duration-150 peer-checked:scale-100"
        />
      </span>
      {label}
    </label>
  )
}

export default RadioButton
