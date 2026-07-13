import Snackbar from '../Snackbar'

export interface SessionExpiredSnackbarProps {
  message: string | null
  onClose: () => void
}

// Snackbar global que informa que la sesión se cerró (ej. por un 401 del
// backend). Se monta una única vez a nivel raíz de la app, dentro del
// <AuthProvider>, para que sea visible en cualquier ruta.
function SessionExpiredSnackbar({ message, onClose }: SessionExpiredSnackbarProps) {
  return <Snackbar message={message} variant="error" onClose={onClose} />
}

export default SessionExpiredSnackbar
