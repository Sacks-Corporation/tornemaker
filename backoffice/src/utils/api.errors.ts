import { AxiosError } from 'axios'
import type { ApiError } from '../types/common.types'

// Extrae el `message` de un error de axios con el shape estándar de Nest
// ({ statusCode, message, error }). Si no se puede resolver, cae al mensaje
// por defecto (ya traducido) que pasa el caller.
export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined
    if (data?.message) return data.message
  }
  return fallbackMessage
}
