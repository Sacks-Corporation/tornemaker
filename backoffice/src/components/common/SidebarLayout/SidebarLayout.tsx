import type { ReactNode } from 'react'

export interface SidebarLayoutProps {
  sidebar: ReactNode
  footer: ReactNode
  children: ReactNode
}

// Layout general del backoffice: sidebar vertical a la izquierda (sin barra
// superior), contenido principal y footer chico al pie del contenido.
function SidebarLayout({ sidebar, footer, children }: SidebarLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        {footer}
      </div>
    </div>
  )
}

export default SidebarLayout
