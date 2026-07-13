import { AxiosError } from 'axios'
import type { ApiError } from '../types/common.types'

// Extrae el `message` de un error de axios con el shape estándar de Nest
// ({ statusCode, message, error }). A diferencia de `auth.errors.ts` (que
// mapea mensajes conocidos a claves i18n), acá el mensaje del back ya viene
// listo para mostrarse tal cual en el snackbar de error.
export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined
    if (data?.message) return data.message
  }
  return fallbackMessage
}
