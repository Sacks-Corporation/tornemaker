import RadioButton from '../RadioButton'
import Skeleton from '../Skeleton'
import type { RadioOption } from '../../../types/common.types'

export interface RadioGroupProps<T extends string = string> {
  label?: string
  name: string
  options: RadioOption<T>[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
  direction?: 'row' | 'column'
  isLoading?: boolean
  loadingLabel?: string
  loadingCount?: number
}

// Cantidad de placeholders a mostrar mientras `isLoading` está en true (el
// catálogo real todavía no llegó, no se sabe cuántas opciones va a tener).
const DEFAULT_LOADING_COUNT = 3

function RadioGroup<T extends string = string>({
  label,
  name,
  options,
  value,
  onChange,
  disabled,
  direction = 'column',
  isLoading = false,
  loadingLabel,
  loadingCount = DEFAULT_LOADING_COUNT,
}: RadioGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2" aria-busy={isLoading || undefined}>
      {label && <legend className="mb-1 text-sm font-medium text-text-muted">{label}</legend>}
      <div
        role={isLoading ? 'status' : undefined}
        aria-label={isLoading ? loadingLabel : undefined}
        className={[
          'flex gap-3',
          direction === 'row' ? 'flex-row flex-wrap items-center' : 'flex-col',
        ].join(' ')}
      >
        {isLoading
          ? Array.from({ length: loadingCount }, (_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          : options.map((option) => (
              <RadioButton
                key={option.value}
                id={`${name}-${option.value}`}
                name={name}
                label={option.label}
                value={option.value}
                checked={value === option.value}
                disabled={disabled || option.disabled}
                onChange={() => onChange(option.value)}
              />
            ))}
      </div>
    </fieldset>
  )
}

export default RadioGroup
