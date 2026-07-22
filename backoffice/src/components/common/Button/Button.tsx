import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from '../Spinner'
import type { SpinnerSize } from '../Spinner'
import type { ButtonSize, ButtonVariant } from '../../../types/common.types'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  // Muestra un Spinner junto al contenido y deshabilita el botón. Útil para
  // acciones async (guardar, confirmar, crear) además del `disabled` plano.
  isLoading?: boolean
  loadingLabel?: string
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary border border-transparent hover:bg-primary-hover active:bg-primary-hover',
  secondary:
    'bg-transparent text-primary border border-primary hover:bg-primary/10 active:bg-primary/20',
  text: 'bg-transparent text-primary border border-transparent hover:bg-primary/10 active:bg-primary/20',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2 text-base',
  lg: 'px-7 py-3 text-lg',
}

const spinnerSizeBySize: Record<ButtonSize, SpinnerSize> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  loadingLabel,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} disabled={disabled || isLoading} aria-busy={isLoading || undefined} {...rest}>
      {isLoading && <Spinner size={spinnerSizeBySize[size]} label={loadingLabel} />}
      {children}
    </button>
  )
}

export default Button
