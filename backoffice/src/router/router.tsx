import { createBrowserRouter } from 'react-router-dom'
import SidebarLayout from '../components/common/SidebarLayout'
import ProtectedRoute from '../components/common/ProtectedRoute'
import DashboardPage from '../components/pages/DashboardPage'
import UsersPage from '../components/pages/UsersPage'
import LoginPage from '../components/pages/LoginPage'

// /login es pública y no lleva SidebarLayout. Todo lo demás cuelga de
// SidebarLayout envuelto en ProtectedRoute: sin sesión, redirige a /login;
// toda página futura del sidebar queda protegida automáticamente.
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <SidebarLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
})

export default router
