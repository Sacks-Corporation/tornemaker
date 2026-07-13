import { useTranslation } from 'react-i18next'
import SessionExpiredSnackbar from './SessionExpiredSnackbar'
import { useAuth } from '../../../hooks/auth/AuthContext'

// El AuthContext solo guarda la clave i18n del mensaje (no depende de i18n
// directamente); este container es quien la resuelve antes de mostrarla.
function SessionExpiredSnackbarContainer() {
  const { t } = useTranslation()
  const { sessionExpiredMessage, dismissSessionExpired } = useAuth()

  const message = sessionExpiredMessage ? t(sessionExpiredMessage) : null

  return <SessionExpiredSnackbar message={message} onClose={dismissSessionExpired} />
}

export default SessionExpiredSnackbarContainer
