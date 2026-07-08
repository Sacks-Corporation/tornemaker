import type { ReactNode } from 'react'
import Header from '../../common/Header'
import Footer from '../../common/Footer'

export interface NewTournamentPageProps {
  children: ReactNode
}

// Shell de la página del wizard de creación de torneo: Header/Footer fijos y
// el contenido del step activo inyectado como children.
function NewTournamentPage({ children }: NewTournamentPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>

      <Footer />
    </div>
  )
}

export default NewTournamentPage
