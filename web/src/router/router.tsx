import { createBrowserRouter } from 'react-router-dom'
import HomePage from '../components/pages/HomePage'
import LoginPage from '../components/pages/LoginPage'
import RegisterPage from '../components/pages/RegisterPage'
import ProtectedRoute from './ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    // Ruta de ejemplo protegida: reutilizá <ProtectedRoute> envolviendo
    // cualquier página que deba requerir sesión iniciada.
    path: '/perfil',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
])

export default router
