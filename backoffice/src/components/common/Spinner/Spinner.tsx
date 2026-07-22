export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

// Ícono de carga genérico (spinner circular animado). Es el bloque base para
// indicar "cargando" en botones y cualquier otro control puntual.
// `role="status"` + texto oculto para lectores de pantalla.
//
// El color del arco usa `currentColor` para heredar el color de texto del
// contexto donde se use; quien necesite un acento puntual lo pasa por
// `className` (ej. `text-primary`).
function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={['inline-flex shrink-0 items-center justify-center', className].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'animate-spin rounded-full border-current/25 border-t-current',
          sizeClasses[size],
        ].join(' ')}
      />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export default Spinner
