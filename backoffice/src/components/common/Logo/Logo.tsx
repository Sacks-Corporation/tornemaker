export type LogoVariant = 'icon' | 'lockup'

export interface LogoProps {
  variant: LogoVariant
  alt: string
  className?: string
}

// Los assets de `public/` se referencian con BASE_URL en vez de una ruta
// absoluta: si el backoffice llegara a desplegarse bajo un sub-path,
// "/logo-light.svg" apuntaría fuera del sitio y la imagen quedaría rota.
const base = import.meta.env.BASE_URL

function Logo({ variant, alt, className = '' }: LogoProps) {
  if (variant === 'icon') {
    // Solo el ícono cuadrado (sin wordmark), para el sidebar colapsado
    // (`w-16`, solo íconos) donde no hay espacio para el texto "Tornemaker".
    return <img src={`${base}favicon.svg`} alt={alt} className={className} />
  }

  // Wordmark completo (ícono + texto "Tornemaker"), para el sidebar expandido
  // (`lg:w-60`). El swap claro/oscuro se resuelve con CSS puro (`dark:`) en
  // vez del hook `useTheme`, para no depender de una instancia compartida.
  // Ambas imágenes están siempre en el DOM y se alterna su visibilidad.
  return (
    <>
      <img src={`${base}logo-light.svg`} alt={alt} className={`${className} dark:hidden`} />
      <img src={`${base}logo-dark.svg`} alt={alt} className={`${className} hidden dark:block`} />
    </>
  )
}

export default Logo
