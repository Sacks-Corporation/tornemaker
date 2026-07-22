import type { ReactNode } from 'react'

export type AlertVariant = 'info' | 'warning'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'border-border bg-surface text-text-muted',
  warning: 'border-primary bg-primary/10 text-text',
}

function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  return (
    <div
      role="status"
      className={[
        'flex gap-3 rounded-lg border px-4 py-3 text-sm',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-7-4a1 1 0 1 0-2 0v4a1 1 0 0 0 2 0V6Zm-1 7a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}

export default Alert
