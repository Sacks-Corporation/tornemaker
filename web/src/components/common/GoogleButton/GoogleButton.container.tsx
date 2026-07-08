import { useTranslation } from 'react-i18next'
import GoogleButton from './GoogleButton'
import { useGoogleIdentityScript } from '../../../hooks/auth/useGoogleIdentityScript'
import type { GoogleButtonText } from '../../../types/google.types'

export interface GoogleButtonContainerProps {
  onCredential: (idToken: string) => void
  text: GoogleButtonText
  disabled?: boolean
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleButtonContainer({ onCredential, text, disabled }: GoogleButtonContainerProps) {
  const { t } = useTranslation()
  const { isReady } = useGoogleIdentityScript()

  return (
    <GoogleButton
      isReady={isReady && Boolean(GOOGLE_CLIENT_ID)}
      clientId={GOOGLE_CLIENT_ID}
      onCredential={onCredential}
      text={text}
      unavailableLabel={t('auth.google.unavailable')}
      disabled={disabled}
    />
  )
}

export default GoogleButtonContainer
