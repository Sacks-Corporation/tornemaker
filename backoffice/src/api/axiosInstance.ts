import axios, { AxiosError } from 'axios'
import { clearStoredSession, getStoredToken } from '../utils/auth.storage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: adjunta el accessToken guardado (si existe) a cada
// request saliente.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

// Response interceptor: ante un 401 (token inválido/expirado) se limpia la
// sesión guardada y se redirige a /login. Se usa un hard redirect (en vez de
// react-router) porque esta capa no tiene acceso al árbol de React.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401) {
      const hadSession = getStoredToken() !== null
      clearStoredSession()
      if (hadSession) {
        window.location.assign(`${import.meta.env.BASE_URL}login`)
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
