import { Outlet } from 'react-router-dom'
import SidebarLayout from './SidebarLayout'
import type { SidebarLayoutProps } from './SidebarLayout'
import Sidebar from '../Sidebar'
import Footer from '../Footer'

// Ruta layout del router: las páginas se renderizan en el <Outlet />.
function SidebarLayoutContainer() {
  return (
    <SidebarLayout sidebar={<Sidebar />} footer={<Footer />}>
      <Outlet />
    </SidebarLayout>
  )
}

export default SidebarLayoutContainer
export type { SidebarLayoutProps }
