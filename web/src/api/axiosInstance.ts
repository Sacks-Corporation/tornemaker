import axios, { AxiosError } from 'axios'
import { clearStoredSession, getStoredAccessToken } from '../utils/auth.storage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

// Nombre del evento disparado cuando el backend responde 401 en una request
// autenticada. El AuthProvider escucha este evento para limpiar la sesión y
// redirigir a /login, evitando así una dependencia circular entre la capa de
// api/ (sin estado de React) y el contexto de auth.
export const SESSION_EXPIRED_EVENT = 'tornemaker:session-expired'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — add auth token when available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

// Response interceptor — global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401) {
      const hadSession = getStoredAccessToken() !== null
      clearStoredSession()
      if (hadSession) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
