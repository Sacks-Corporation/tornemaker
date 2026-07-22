import { createBrowserRouter } from 'react-router-dom'
import SidebarLayout from '../components/common/SidebarLayout'
import DashboardPage from '../components/pages/DashboardPage'

// SidebarLayout es la ruta layout: todas las páginas se renderizan dentro de
// su <Outlet /> para compartir sidebar y footer.
const router = createBrowserRouter([
  {
    path: '/',
    element: <SidebarLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
})

export default router
