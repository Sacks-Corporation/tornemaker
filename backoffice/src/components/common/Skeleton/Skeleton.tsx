export interface SkeletonProps {
  className?: string
}

// Bloque de carga genérico (placeholder pulsante). Es puramente decorativo
// (`aria-hidden`): el feedback accesible ("Cargando…") lo da el contenedor
// que agrupa los skeletons vía `role="status"` + `aria-label`, para no
// duplicar el mismo anuncio por cada bloque individual.
function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={['block animate-pulse rounded-md bg-text-muted/15', className].join(' ')}
    />
  )
}

export default Skeleton
