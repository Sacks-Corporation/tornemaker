import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// TODO: cuando exista autenticación del backoffice, agregar acá los
// interceptors de request (Authorization) y de response (401 → logout),
// siguiendo el patrón de web/src/api/axiosInstance.ts.

export default axiosInstance
