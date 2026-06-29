import { createBrowserRouter } from 'react-router-dom'
import HomePage from '../components/pages/HomePage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
])

export default router
