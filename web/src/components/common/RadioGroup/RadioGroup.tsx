import RadioButton from '../RadioButton'
import type { RadioOption } from '../../../types/common.types'

export interface RadioGroupProps<T extends string = string> {
  label?: string
  name: string
  options: RadioOption<T>[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
  direction?: 'row' | 'column'
}

function RadioGroup<T extends string = string>({
  label,
  name,
  options,
  value,
  onChange,
  disabled,
  direction = 'column',
}: RadioGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      {label && <legend className="mb-1 text-sm font-medium text-text-muted">{label}</legend>}
      <div
        className={[
          'flex gap-3',
          direction === 'row' ? 'flex-row flex-wrap items-center' : 'flex-col',
        ].join(' ')}
      >
        {options.map((option) => (
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
