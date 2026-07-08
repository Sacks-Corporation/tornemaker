import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string
  description?: string
  icon?: ReactNode
  selected?: boolean
  disabled?: boolean
}

// Card grande, clickeable/seleccionable. Se usa, por ejemplo, para elegir el
// formato de torneo en FormatStep. Es un <div> interactivo (no un <button>)
// con role/tabIndex/teclado para mantener la accesibilidad.
function Card({
  title,
  description,
  icon,
  selected = false,
  disabled = false,
  className = '',
  onClick,
  ...rest
}: CardProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    onClick?.(event)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    event.currentTarget.click()
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'relative flex w-full flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-colors duration-150 sm:p-6',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/40'
          : 'border-border bg-surface hover:border-primary/60',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...rest}
    >
      {selected && (
        <span
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
          aria-hidden="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.796 2.796 6.79-6.882a1 1 0 0 1 1.414-.02Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
      {icon && <span className="text-primary">{icon}</span>}
      <span className="text-base font-semibold text-text sm:text-lg">{title}</span>
      {description && <span className="text-sm text-text-muted">{description}</span>}
    </div>
  )
}

export default Card
