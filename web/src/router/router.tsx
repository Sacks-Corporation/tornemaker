import { createBrowserRouter } from 'react-router-dom'
import HomePage from '../components/pages/HomePage'
import LoginPage from '../components/pages/LoginPage'
import RegisterPage from '../components/pages/RegisterPage'
import NewTournamentPage from '../components/pages/NewTournamentPage'
import TournamentPage from '../components/pages/TournamentPage'
import TournamentListPage from '../components/pages/TournamentListPage'
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
    path: '/new',
    element: (
      <ProtectedRoute>
        <NewTournamentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tournaments',
    element: (
      <ProtectedRoute>
        <TournamentListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tournament/:id',
    element: (
      <ProtectedRoute>
        <TournamentPage />
      </ProtectedRoute>
    ),
  },
])

export default router
