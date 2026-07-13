export type LogoVariant = 'header' | 'lockup'

export interface LogoProps {
  variant: LogoVariant
  alt: string
  className?: string
}

function Logo({ variant, alt, className = '' }: LogoProps) {
  if (variant === 'header') {
    // El header siempre usa un fondo naranja saturado (claro u oscuro), así
    // que el logo no puede usar colores fijos (quedaría desintegrado del
    // fondo). En vez de la imagen raster, se usa un ícono inline monocromático
    // con `currentColor` + el wordmark como texto real, ambos heredando
    // `text-on-header` igual que el resto del contenido del header (nombre
    // de usuario, botón de tema).
    return (
      <span className={`inline-flex items-center gap-2 text-on-header ${className}`}>
        <svg
          viewBox="0 0 64 64"
          className="h-7 w-7 rounded-lg bg-on-header/10 p-1"
          aria-hidden="true"
        >
          <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none">
            <path d="M16 19 H29" />
            <path d="M16 45 H29" />
            <path d="M29 19 V45" />
            <path d="M29 32 H40" />
          </g>
          <circle cx="47" cy="32" r="6" fill="currentColor" />
        </svg>
        <span className="text-lg font-bold tracking-tight sm:text-xl">{alt}</span>
      </span>
    )
  }

  // Lockup de contenido (Home, Login, Register): el swap claro/oscuro se
  // resuelve con CSS puro (`dark:`) en vez de con el hook `useTheme`, porque
  // ese hook no comparte estado entre instancias y quedaría desincronizado
  // con el toggle del Header hasta un remount. Ambas imágenes están siempre
  // en el DOM y se alterna su visibilidad con clases `dark:`.
  return (
    <>
      <img src="/logo-light.svg" alt={alt} className={`${className} dark:hidden`} />
      <img src="/logo-dark.svg" alt={alt} className={`${className} hidden dark:block`} />
    </>
  )
}

export default Logo
